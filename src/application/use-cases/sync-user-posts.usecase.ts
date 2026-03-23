// =====================================================
// LinkedBridge — SyncUserPosts Use Case
// =====================================================
// Orchestrates the full post synchronization pipeline:
//
// 1. Retrieve encrypted OAuth credential
// 2. Check token expiry (fail-fast if expired)
// 3. Decrypt the access token (AES-256-GCM)
// 4. Fetch posts from LinkedIn via Gateway
// 5. IMMEDIATELY destroy plaintext token in memory
// 6. Sanitize content (Stored XSS prevention)
// 7. Upsert sanitized posts into the cache
//
// MEMORY ISOLATION:
// The decrypted access token exists in memory for the
// absolute minimum number of operations (steps 4-5).
// After the Gateway call, the variable is overwritten
// with an empty string to hint the GC to release it.
// This is a defense-in-depth measure — a memory dump
// should never contain plaintext tokens.
// =====================================================

import type { ICryptoService } from '../../domain/interfaces/crypto.interface.js';
import type { ILinkedInGateway } from '../../domain/gateways/i-linkedin.gateway.js';
import type { IOAuthCredentialRepository } from '../../domain/repositories/i-oauth-credential.repository.js';
import type { IPostCacheRepository } from '../../domain/repositories/i-post-cache.repository.js';
import type { IUserRepository } from '../../domain/repositories/i-user.repository.js';
import type { UpsertPostCacheInput } from '../../domain/entities/post-cache.entity.js';

import { ResourceNotFoundError } from '../../domain/errors/resource-not-found.error.js';
import { TokenExpiredError } from '../../domain/errors/token-expired.error.js';
import { isTokenExpired } from '../../domain/entities/oauth-credential.entity.js';
import { stripHtml, sanitizeUrl } from '../../infra/http/utils/sanitize.js';

/**
 * Output of the sync operation.
 * Returns a summary — never exposes tokens or credentials.
 */
export interface SyncUserPostsOutput {
  userId: string;
  postsCount: number;
  syncedAt: Date;
}

export class SyncUserPostsUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly oauthCredentialRepository: IOAuthCredentialRepository,
    private readonly postCacheRepository: IPostCacheRepository,
    private readonly linkedInGateway: ILinkedInGateway,
    private readonly cryptoService: ICryptoService,
  ) {}

  /**
   * Synchronizes a user's LinkedIn posts to the local cache.
   *
   * This method:
   * 1. Validates the user and credential exist
   * 2. Checks token expiry (fail-fast for refresh flow)
   * 3. Decrypts the token, fetches posts, then destroys the plaintext
   * 4. Sanitizes all content (XSS prevention)
   * 5. Upserts the cleaned posts into PostCache
   *
   * @param userId - The internal user ID (UUID)
   * @returns Summary of the sync operation
   * @throws ResourceNotFoundError if user or credential not found
   * @throws TokenExpiredError if the access token has expired
   */
  async execute(userId: string): Promise<SyncUserPostsOutput> {
    // ─── Step 1: Verify the user exists ───
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new ResourceNotFoundError('User');
    }

    // ─── Step 2: Retrieve the encrypted credential ───
    const credential = await this.oauthCredentialRepository.findByUserId(userId);
    if (!credential) {
      throw new ResourceNotFoundError('OAuth credential');
    }

    // ─── Step 3: Check token expiry (fail-fast) ───
    // Uses the 5-minute buffer defined in the entity.
    // If expired, the caller (or a future task) must handle token refresh.
    if (isTokenExpired(credential)) {
      throw new TokenExpiredError(
        'The LinkedIn access token has expired. Re-authorization is required.',
      );
    }

    // ─── Step 4: Decrypt the access token ───
    // MEMORY ISOLATION: The plaintext token is stored in a `let`
    // variable so we can overwrite it immediately after use.
    let plainTextToken: string | null = this.cryptoService.decrypt(
      credential.encryptedAccessToken,
      credential.iv,
      credential.authTag,
    );

    // ─── Step 5: Fetch posts from LinkedIn ───
    // The author URN is constructed from the provider ID stored
    // during the OAuth flow.
    const authorUrn = `urn:li:person:${credential.userId}`;

    let posts;
    try {
      posts = await this.linkedInGateway.fetchRecentPosts(
        plainTextToken,
        authorUrn,
      );
    } finally {
      // ─── Step 5b: DESTROY the plaintext token ───
      // MEMORY ISOLATION: Overwrite with empty string immediately
      // after the Gateway call, whether it succeeded or not.
      // The original plaintext string becomes unreachable and will
      // be garbage-collected.
      plainTextToken = null;
    }

    // ─── Step 6: Sanitize content (Zero Trust) ───
    // STORED XSS PREVENTION: We strip ALL HTML tags, script blocks,
    // and dangerous URL protocols from the post content before
    // persisting. This ensures that portfolio sites consuming our
    // API cannot be attacked even if they don't sanitize on render.
    const sanitizedPosts: UpsertPostCacheInput[] = posts.map((post) => ({
      userId,
      externalPostId: post.externalPostId,
      content: {
        text: stripHtml(post.text),
        imageUrl: sanitizeUrl(post.imageUrl) ?? null,
      },
      imageUrl: sanitizeUrl(post.imageUrl) ?? null,
      postedAt: post.publishedAt,
    }));

    // ─── Step 7: Upsert into the cache ───
    if (sanitizedPosts.length > 0) {
      await this.postCacheRepository.upsertPosts(sanitizedPosts);
    }

    return {
      userId,
      postsCount: sanitizedPosts.length,
      syncedAt: new Date(),
    };
  }
}
