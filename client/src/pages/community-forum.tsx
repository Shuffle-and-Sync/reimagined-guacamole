import React, { useState, useEffect } from "react";
import { useDocumentTitle } from "@/hooks/useDocumentTitle";
import { Header } from "@/shared/components";
import { Footer } from "@/shared/components";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/features/auth";
import { useCommunity } from "@/features/communities";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import type { User, Community, ForumPost, ForumReply } from "@shared/schema";

const FORUM_CATEGORIES = [
  { id: "strategy", name: "Strategy & Tactics", icon: "fas fa-chess", color: "bg-blue-500" },
  { id: "deck-tech", name: "Deck Tech", icon: "fas fa-layer-group", color: "bg-purple-500" },
  { id: "stream-tips", name: "Streaming Tips", icon: "fas fa-video", color: "bg-red-500" },
  { id: "collaboration", name: "Collaboration", icon: "fas fa-handshake", color: "bg-green-500" },
  { id: "general", name: "General Discussion", icon: "fas fa-comments", color: "bg-gray-500" },
];

type ExtendedForumPost = ForumPost & { 
  author: User; 
  community: Community; 
  replyCount: number; 
  likeCount: number; 
  isLiked?: boolean; 
};

type ExtendedForumReply = ForumReply & { 
  author: User; 
  isLiked?: boolean; 
};

export default function CommunityForum() {
  useDocumentTitle("Community Forum");
  
  const { user } = useAuth();
  const { selectedCommunity, communityTheme } = useCommunity();
  const { toast } = useToast();
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedPost, setSelectedPost] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

  // New post form state
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostCategory, setNewPostCategory] = useState("");
  const [newPostContent, setNewPostContent] = useState("");

  // Reply form state
  const [replyContent, setReplyContent] = useState("");

  // Fetch forum posts for selected community
  const { data: posts = [], isLoading: postsLoading, refetch: refetchPosts } = useQuery<ExtendedForumPost[]>({
    queryKey: ['/api/forum/posts', selectedCommunity?.id, selectedCategory],
    queryFn: async () => {
      if (!selectedCommunity) return [];
      const params = new URLSearchParams({
        communityId: selectedCommunity.id,
        ...(selectedCategory !== 'all' && { category: selectedCategory }),
      });
      const response = await fetch(`/api/forum/posts?${params}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch posts');
      return response.json();
    },
    enabled: !!selectedCommunity,
  });

  // Fetch detailed post when one is selected
  const { data: currentPost, isLoading: postLoading, refetch: refetchCurrentPost } = useQuery<ExtendedForumPost>({
    queryKey: ['/api/forum/posts', selectedPost],
    queryFn: async () => {
      if (!selectedPost || !user) return null;
      const params = new URLSearchParams({ userId: user.id });
      const response = await fetch(`/api/forum/posts/${selectedPost}?${params}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch post');
      return response.json();
    },
    enabled: !!selectedPost && !!user,
  });

  // Fetch replies for current post
  const { data: replies = [], isLoading: repliesLoading, refetch: refetchReplies } = useQuery<ExtendedForumReply[]>({
    queryKey: ['/api/forum/posts', selectedPost, 'replies'],
    queryFn: async () => {
      if (!selectedPost || !user) return [];
      const params = new URLSearchParams({ userId: user.id });
      const response = await fetch(`/api/forum/posts/${selectedPost}/replies?${params}`, { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to fetch replies');
      return response.json();
    },
    enabled: !!selectedPost && !!user,
  });

  // Create forum post mutation
  const createPostMutation = useMutation({
    mutationFn: async (postData: any) => {
      const response = await fetch('/api/forum/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(postData),
      });
      if (!response.ok) throw new Error('Failed to create post');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Post created successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/forum/posts'] });
      setIsCreateDialogOpen(false);
      setNewPostTitle("");
      setNewPostCategory("");
      setNewPostContent("");
    },
    onError: () => {
      toast({ title: "Failed to create post", variant: "destructive" });
    },
  });

  // Create reply mutation
  const createReplyMutation = useMutation({
    mutationFn: async ({ postId, content }: { postId: string; content: string }) => {
      const response = await fetch(`/api/forum/posts/${postId}/replies`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      });
      if (!response.ok) throw new Error('Failed to create reply');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Reply posted successfully!" });
      queryClient.invalidateQueries({ queryKey: ['/api/forum/posts'] });
      setReplyContent("");
      refetchReplies();
      refetchPosts();
    },
    onError: () => {
      toast({ title: "Failed to post reply", variant: "destructive" });
    },
  });

  // Like post mutation
  const likePostMutation = useMutation({
    mutationFn: async ({ postId, isCurrentlyLiked }: { postId: string; isCurrentlyLiked: boolean }) => {
      const url = `/api/forum/posts/${postId}/like`;
      const method = isCurrentlyLiked ? 'DELETE' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });
      if (!response.ok) throw new Error(`Failed to ${isCurrentlyLiked ? 'unlike' : 'like'} post`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/forum/posts'] });
      refetchCurrentPost();
    },
  });

  const handleCreatePost = () => {
    if (!selectedCommunity) {
      toast({ title: "Please select a community first", variant: "destructive" });
      return;
    }
    
    if (!newPostTitle || !newPostCategory || !newPostContent) {
      toast({ title: "Please fill in all fields", variant: "destructive" });
      return;
    }

    createPostMutation.mutate({
      title: newPostTitle,
      category: newPostCategory,
      content: newPostContent,
      communityId: selectedCommunity.id,
    });
  };

  const handleReply = () => {
    if (!selectedPost || !replyContent.trim()) {
      toast({ title: "Please enter a reply", variant: "destructive" });
      return;
    }

    createReplyMutation.mutate({
      postId: selectedPost,
      content: replyContent,
    });
  };

  const handleLike = (post: ExtendedForumPost) => {
    if (!user) {
      toast({ title: "Please sign in to like posts", variant: "destructive" });
      return;
    }

    likePostMutation.mutate({
      postId: post.id,
      isCurrentlyLiked: !!post.isLiked,
    });
  };

  const getCategoryIcon = (category: string) => {
    const cat = FORUM_CATEGORIES.find(c => c.id === category);
    return cat?.icon || "fas fa-comments";
  };

  const getCategoryColor = (category: string) => {
    const cat = FORUM_CATEGORIES.find(c => c.id === category);
    return cat?.color || "bg-gray-500";
  };

  if (!selectedCommunity) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto text-center">
            <h1 className="text-3xl font-bold mb-4">Community Forum</h1>
            <p className="text-muted-foreground mb-8">
              Please select a community from the navigation to view its forum.
            </p>
            <Button onClick={() => window.location.href = "/"} data-testid="button-back-home">
              <i className="fas fa-home mr-2"></i>
              Back to Home
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (selectedPost) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        
        <main className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            {/* Back button */}
            <Button 
              variant="ghost" 
              onClick={() => setSelectedPost(null)}
              className="mb-6"
              data-testid="button-back-to-forum"
            >
              <i className="fas fa-arrow-left mr-2"></i>
              Back to Forum
            </Button>

            {/* Post details */}
            {postLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : currentPost ? (
              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge className={`${getCategoryColor(currentPost.category)} text-white`}>
                            <i className={`${getCategoryIcon(currentPost.category)} mr-1`}></i>
                            {FORUM_CATEGORIES.find(c => c.id === currentPost.category)?.name || currentPost.category}
                          </Badge>
                          {currentPost.isPinned && (
                            <Badge variant="secondary">
                              <i className="fas fa-thumbtack mr-1"></i>
                              Pinned
                            </Badge>
                          )}
                        </div>
                        <h1 className="text-2xl font-bold">{currentPost.title}</h1>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-6 w-6">
                              <AvatarImage src={currentPost.author.profileImageUrl || undefined} />
                              <AvatarFallback className="text-xs">
                                {(currentPost.author.firstName || currentPost.author.username || currentPost.author.email)?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span>{currentPost.author.firstName || currentPost.author.username || currentPost.author.email}</span>
                          </div>
                          <span>•</span>
                          <span>{formatDistanceToNow(currentPost.createdAt || new Date())} ago</span>
                          <span>•</span>
                          <span>{currentPost.viewCount} views</span>
                        </div>
                      </div>
                      
                      <Button
                        variant={currentPost.isLiked ? "default" : "outline"}
                        size="sm"
                        onClick={() => handleLike(currentPost)}
                        disabled={!user || likePostMutation.isPending}
                        data-testid="button-like-post"
                      >
                        <i className={`fas fa-heart mr-1 ${currentPost.isLiked ? 'text-red-500' : ''}`}></i>
                        {currentPost.likeCount}
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="prose prose-sm max-w-none dark:prose-invert">
                      {currentPost.content.split('\n').map((paragraph: string, index: number) => (
                        <p key={index}>{paragraph}</p>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Replies section */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <i className="fas fa-comments"></i>
                      Replies ({replies.length})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Reply form */}
                    {user && (
                      <div className="border-b pb-4">
                        <div className="flex gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.profileImageUrl || undefined} />
                            <AvatarFallback className="text-xs">
                              {(user.firstName || user.username || user.email)?.[0]?.toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <Textarea
                              placeholder="Write your reply..."
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              className="min-h-[80px]"
                              data-testid="textarea-reply-content"
                            />
                            <Button
                              onClick={handleReply}
                              disabled={!replyContent.trim() || createReplyMutation.isPending}
                              data-testid="button-post-reply"
                            >
                              {createReplyMutation.isPending ? "Posting..." : "Post Reply"}
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Replies list */}
                    {repliesLoading ? (
                      <div className="flex justify-center py-4">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                      </div>
                    ) : replies.length > 0 ? (
                      <div className="space-y-4">
                        {replies.map((reply) => (
                          <div key={reply.id} className="flex gap-3 p-4 rounded-lg bg-muted/50">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={reply.author.profileImageUrl || undefined} />
                              <AvatarFallback className="text-xs">
                                {(reply.author.firstName || reply.author.username || reply.author.email)?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="font-medium">
                                  {reply.author.firstName || reply.author.username || reply.author.email}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {formatDistanceToNow(reply.createdAt || new Date())} ago
                                </span>
                              </div>
                              <div className="prose prose-sm max-w-none dark:prose-invert">
                                {reply.content.split('\n').map((paragraph: string, index: number) => (
                                  <p key={index}>{paragraph}</p>
                                ))}
                              </div>
                              <div className="flex items-center gap-2 mt-2">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 px-2 text-xs"
                                  data-testid={`button-like-reply-${reply.id}`}
                                >
                                  <i className="fas fa-heart mr-1"></i>
                                  {reply.likeCount}
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <i className="fas fa-comments text-4xl mb-4 opacity-50"></i>
                        <p>No replies yet. Be the first to respond!</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-muted-foreground">Post not found</p>
              </div>
            )}
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold mb-2">
                {selectedCommunity.displayName} Forum
              </h1>
              <p className="text-muted-foreground">
                Connect with fellow {selectedCommunity.displayName} players and streamers
              </p>
            </div>
            
            {user && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button data-testid="button-create-post">
                    <i className="fas fa-plus mr-2"></i>
                    New Post
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create New Post</DialogTitle>
                    <DialogDescription>
                      Share your thoughts with the {selectedCommunity.displayName} community
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="title">Title</Label>
                      <Input
                        id="title"
                        placeholder="Enter your post title..."
                        value={newPostTitle}
                        onChange={(e) => setNewPostTitle(e.target.value)}
                        data-testid="input-post-title"
                      />
                    </div>
                    <div>
                      <Label htmlFor="category">Category</Label>
                      <Select value={newPostCategory} onValueChange={setNewPostCategory}>
                        <SelectTrigger data-testid="select-post-category">
                          <SelectValue placeholder="Select a category" />
                        </SelectTrigger>
                        <SelectContent>
                          {FORUM_CATEGORIES.map((category) => (
                            <SelectItem key={category.id} value={category.id}>
                              <div className="flex items-center gap-2">
                                <i className={`${category.icon} text-sm`}></i>
                                {category.name}
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="content">Content</Label>
                      <Textarea
                        id="content"
                        placeholder="Share your thoughts, strategies, or questions..."
                        value={newPostContent}
                        onChange={(e) => setNewPostContent(e.target.value)}
                        className="min-h-[120px]"
                        data-testid="textarea-post-content"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setIsCreateDialogOpen(false)}
                        data-testid="button-cancel-post"
                      >
                        Cancel
                      </Button>
                      <Button
                        onClick={handleCreatePost}
                        disabled={createPostMutation.isPending}
                        data-testid="button-submit-post"
                      >
                        {createPostMutation.isPending ? "Creating..." : "Create Post"}
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Category filters */}
          <div className="flex gap-2 mb-6 overflow-x-auto">
            <Button
              variant={selectedCategory === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setSelectedCategory("all")}
              data-testid="filter-category-all"
            >
              All Categories
            </Button>
            {FORUM_CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                data-testid={`filter-category-${category.id}`}
              >
                <i className={`${category.icon} mr-1`}></i>
                {category.name}
              </Button>
            ))}
          </div>

          {/* Posts list */}
          {postsLoading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post) => (
                <Card 
                  key={post.id} 
                  className="cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => setSelectedPost(post.id)}
                  data-testid={`post-card-${post.id}`}
                >
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge className={`${getCategoryColor(post.category)} text-white`}>
                            <i className={`${getCategoryIcon(post.category)} mr-1`}></i>
                            {FORUM_CATEGORIES.find(c => c.id === post.category)?.name || post.category}
                          </Badge>
                          {post.isPinned && (
                            <Badge variant="secondary">
                              <i className="fas fa-thumbtack mr-1"></i>
                              Pinned
                            </Badge>
                          )}
                        </div>
                        
                        <h3 className="text-lg font-semibold mb-2 line-clamp-2">
                          {post.title}
                        </h3>
                        
                        <p className="text-muted-foreground mb-3 line-clamp-2">
                          {post.content}
                        </p>
                        
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Avatar className="h-5 w-5">
                              <AvatarImage src={post.author.profileImageUrl || undefined} />
                              <AvatarFallback className="text-xs">
                                {(post.author.firstName || post.author.username || post.author.email)?.[0]?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            <span>{post.author.firstName || post.author.username || post.author.email}</span>
                          </div>
                          <span>•</span>
                          <span>{formatDistanceToNow(post.createdAt || new Date())} ago</span>
                          <span>•</span>
                          <span>{post.viewCount} views</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground ml-4">
                        <div className="flex items-center gap-1">
                          <i className="fas fa-heart"></i>
                          <span>{post.likeCount}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <i className="fas fa-comments"></i>
                          <span>{post.replyCount}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <i className="fas fa-comments text-6xl text-muted-foreground/50 mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">No posts yet</h3>
              <p className="text-muted-foreground mb-6">
                Be the first to start a conversation in the {selectedCommunity.displayName} community!
              </p>
              {user && (
                <Button onClick={() => setIsCreateDialogOpen(true)} data-testid="button-create-first-post">
                  <i className="fas fa-plus mr-2"></i>
                  Create First Post
                </Button>
              )}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}