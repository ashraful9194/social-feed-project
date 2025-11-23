using Microsoft.EntityFrameworkCore;
using SocialFeed.API.Entities;

namespace SocialFeed.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User> Users { get; set; }
    public DbSet<Post> Posts { get; set; }
    public DbSet<Comment> Comments { get; set; }
    public DbSet<PostLike> PostLikes { get; set; }
    public DbSet<CommentLike> CommentLikes { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        // 1. Unique Email
        modelBuilder.Entity<User>().HasIndex(u => u.Email).IsUnique();

        // 2. Performance Indexes (For "Millions of posts")
        // We will query feed by Date, so we index CreatedAt
        modelBuilder.Entity<Post>().HasIndex(p => p.CreatedAt);
        modelBuilder.Entity<Post>().HasIndex(p => p.IsPrivate);

        // 3. Composite Keys for Likes (User can only like a post ONCE)
        modelBuilder.Entity<PostLike>()
            .HasKey(pl => new { pl.PostId, pl.UserId });

        modelBuilder.Entity<CommentLike>()
            .HasKey(cl => new { cl.CommentId, cl.UserId });

        // 4. Configure Self-Referencing Comments (Replies)
        modelBuilder.Entity<Comment>()
            .HasOne(c => c.ParentComment)
            .WithMany(c => c.Replies)
            .HasForeignKey(c => c.ParentCommentId)
            .OnDelete(DeleteBehavior.Restrict); // Prevent cascading delete issues
    }
}