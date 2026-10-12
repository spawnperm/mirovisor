import React, { useState } from 'react';
import { 
  Users, 
  Heart, 
  MessageCircle, 
  Share2, 
  Send, 
  Radio, 
  Sparkles,
  TrendingUp,
  Tag
} from 'lucide-react';
import { SocialPost, Tenant, User } from '../../types';

interface CommunityFeedViewProps {
  tenant: Tenant;
  currentUser: User;
  posts: SocialPost[];
  onAddPost: (post: SocialPost) => void;
}

export const CommunityFeedView: React.FC<CommunityFeedViewProps> = ({
  tenant,
  currentUser,
  posts,
  onAddPost,
}) => {
  const [feedMode, setFeedMode] = useState<'tenant' | 'personal'>('tenant');
  const [postContent, setPostContent] = useState<string>('');
  const [postTags, setPostTags] = useState<string>('#evolution, #security');
  const [likedPosts, setLikedPosts] = useState<Record<string, boolean>>({});

  // Tenant feed = posts from active tenant.
  // Personal feed = posts from tenants user follows (currentUser.followingTenants).
  const visiblePosts = posts.filter((p) => {
    if (feedMode === 'tenant') {
      return p.tenantId === tenant.id;
    }
    return currentUser.followingTenants.includes(p.tenantId);
  });

  const handlePublish = () => {
    if (!postContent.trim()) return;
    const tagsArray = postTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const newPost: SocialPost = {
      id: `post_${Date.now()}`,
      authorId: currentUser.id,
      authorName: currentUser.fullName,
      authorAvatar: currentUser.avatarUrl,
      tenantId: tenant.id,
      tenantName: tenant.name,
      content: postContent.trim(),
      tags: tagsArray,
      likes: 1,
      commentsCount: 0,
      timestamp: 'Только что',
    };

    onAddPost(newPost);
    setPostContent('');
  };

  const toggleLike = (postId: string) => {
    setLikedPosts((prev) => ({ ...prev, [postId]: !prev[postId] }));
  };

  return (
    <div className="flex flex-col h-full bg-neutral-950 p-4 gap-4">
      {/* Top Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-neutral-900/80 p-3 rounded-xl border border-neutral-800">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-sky-500/10 border border-sky-500/30 rounded-lg text-sky-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white flex items-center gap-2">
              СОЦИАЛЬНЫЙ СЛОЙ И ЛЕНТЫ СООБЩЕСТВА
              <span className="text-[10px] font-mono px-1.5 py-0.5 bg-neutral-800 text-neutral-300 rounded">
                Fan-Out On Write (Redis + NATS)
              </span>
            </h2>
            <div className="text-xs text-neutral-400">
              Активный тенант: <strong className="text-white">{tenant.name}</strong> · Видимость: {tenant.visibility}
            </div>
          </div>
        </div>

        {/* Feed Switcher */}
        <div className="flex bg-neutral-950 p-1 rounded-lg border border-neutral-800 text-xs">
          <button
            onClick={() => setFeedMode('tenant')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              feedMode === 'tenant'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Лента тенанта ({tenant.slug})
          </button>
          <button
            onClick={() => setFeedMode('personal')}
            className={`px-3 py-1 rounded-md font-medium transition-colors ${
              feedMode === 'personal'
                ? 'bg-neutral-800 text-white'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Персональная лента (Агрегатор подписок)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 flex-1 overflow-hidden">
        {/* Posts Stream (Left/Center) */}
        <div className="lg:col-span-2 flex flex-col gap-3 overflow-y-auto pr-1">
          {/* Post Composer */}
          <div className="p-3 bg-neutral-900/90 border border-neutral-800 rounded-xl space-y-2.5">
            <div className="flex gap-2.5">
              <img
                src={currentUser.avatarUrl}
                alt={currentUser.fullName}
                className="w-8 h-8 rounded-full object-cover border border-neutral-700"
              />
              <textarea
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder={`Поделиться обновлением или архитектурной мыслью в сообществе ${tenant.name}...`}
                rows={2}
                className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg p-2.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-sky-500"
              />
            </div>
            <div className="flex items-center justify-between text-xs pt-1">
              <div className="flex items-center gap-1.5 text-neutral-500 text-[11px]">
                <Tag className="w-3.5 h-3.5" />
                <input
                  type="text"
                  value={postTags}
                  onChange={(e) => setPostTags(e.target.value)}
                  className="bg-transparent text-neutral-300 focus:outline-none font-mono text-[11px] w-48"
                  placeholder="#теги..."
                />
              </div>
              <button
                onClick={handlePublish}
                disabled={!postContent.trim()}
                className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-lg text-xs flex items-center gap-1.5 transition-colors disabled:opacity-40"
              >
                <Send className="w-3 h-3" /> Опубликовать (Fan-out)
              </button>
            </div>
          </div>

          {/* Posts List */}
          {visiblePosts.length === 0 ? (
            <div className="p-8 text-center border border-dashed border-neutral-800 rounded-xl text-neutral-500 text-xs">
              В этой ленте пока нет записей. Будьте первым, кто опубликует обновление!
            </div>
          ) : (
            visiblePosts.map((post) => {
              const isLiked = likedPosts[post.id];
              const likesCount = isLiked ? post.likes + 1 : post.likes;

              return (
                <div
                  key={post.id}
                  className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2.5 shadow-sm"
                >
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={post.authorAvatar}
                        alt={post.authorName}
                        className="w-8 h-8 rounded-full object-cover border border-neutral-700"
                      />
                      <div>
                        <div className="font-semibold text-white">{post.authorName}</div>
                        <div className="text-[10px] text-neutral-400 font-mono">
                          {post.tenantName} · {post.timestamp}
                        </div>
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-500 bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">
                      NATS Pub/Sub
                    </span>
                  </div>

                  <p className="text-xs text-neutral-200 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>

                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {post.tags.map((tag) => (
                        <span key={tag} className="text-[11px] font-mono text-sky-400">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 pt-2 border-t border-neutral-800/80 text-xs text-neutral-400">
                    <button
                      onClick={() => toggleLike(post.id)}
                      className={`flex items-center gap-1.5 transition-colors ${
                        isLiked ? 'text-rose-400 font-semibold' : 'hover:text-white'
                      }`}
                    >
                      <Heart className={`w-3.5 h-3.5 ${isLiked ? 'fill-current' : ''}`} />
                      {likesCount}
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-white transition-colors">
                      <MessageCircle className="w-3.5 h-3.5" />
                      {post.commentsCount}
                    </button>
                    <button className="flex items-center gap-1.5 hover:text-white transition-colors ml-auto">
                      <Share2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Community Sidebar */}
        <div className="space-y-3">
          <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-3 text-xs">
            <h3 className="font-bold text-white flex items-center gap-2">
              <Users className="w-4 h-4 text-cyan-400" />
              О сообществе {tenant.name}
            </h3>
            <p className="text-neutral-400 leading-relaxed">{tenant.description}</p>
            <div className="space-y-1.5 pt-2 border-t border-neutral-800 text-[11px] text-neutral-400">
              <div className="flex justify-between">
                <span>Участников:</span>
                <span className="font-mono text-white">{tenant.memberCount} человек</span>
              </div>
              <div className="flex justify-between">
                <span>Владелец:</span>
                <span className="text-neutral-200">{tenant.ownerName}</span>
              </div>
              <div className="flex justify-between">
                <span>Создано:</span>
                <span className="font-mono text-neutral-300">{tenant.createdAt}</span>
              </div>
            </div>
          </div>

          <div className="p-4 bg-neutral-900/60 border border-neutral-800 rounded-xl space-y-2 text-xs">
            <h4 className="font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              Популярные теги платформы
            </h4>
            <div className="flex flex-wrap gap-1.5 pt-1">
              {['#architecture', '#asvs5', '#rls_force', '#webcontainers', '#mcp_bridge', '#ever_gauzy', '#univer'].map(
                (t) => (
                  <span
                    key={t}
                    className="px-2 py-0.5 bg-neutral-950 border border-neutral-800 rounded text-[10px] font-mono text-neutral-300"
                  >
                    {t}
                  </span>
                )
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
