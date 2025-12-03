using BCrypt.Net;
using SocialFeed.API.Data;
using SocialFeed.API.Entities;

namespace SocialFeed.API.Data;

public static class DataSeeder
{
    public static void Seed(AppDbContext context)
    {
        // 1. Check if users already exist
        if (context.Users.Any())
        {
            return; // DB has been seeded
        }

        // 2. Create Users
        var passwordHash = "$2a$11$.yjULX9RNpuV52BUErA0TOWafLdp2cvBGDa22cpuJLGXd88bnR2nq"; // Hash for 'Password123!'

        var users = new List<User>
        {
            new User { FirstName = "John", LastName = "Doe", Email = "john@example.com", PasswordHash = passwordHash, ProfileImageUrl = "/assets/images/card_ppl1.png", CreatedAt = DateTime.UtcNow },
            new User { FirstName = "Jane", LastName = "Smith", Email = "jane@example.com", PasswordHash = passwordHash, ProfileImageUrl = "/assets/images/card_ppl2.png", CreatedAt = DateTime.UtcNow },
            new User { FirstName = "Alice", LastName = "Johnson", Email = "alice@example.com", PasswordHash = passwordHash, ProfileImageUrl = "/assets/images/card_ppl3.png", CreatedAt = DateTime.UtcNow }
        };

        context.Users.AddRange(users);
        context.SaveChanges(); // Save to get IDs

        // 3. Create Posts
        var posts = new List<Post>
        {
            new Post { Content = "Hello World! This is my first post.", IsPrivate = false, CreatedAt = DateTime.UtcNow.AddDays(-2), UserId = users[0].Id },
            new Post { Content = "Enjoying the beautiful weather today!", ImageUrl = "/assets/images/post.png", IsPrivate = false, CreatedAt = DateTime.UtcNow.AddDays(-1), UserId = users[0].Id },
            new Post { Content = "Just a private thought.", IsPrivate = true, CreatedAt = DateTime.UtcNow.AddHours(-5), UserId = users[1].Id }
        };

        context.Posts.AddRange(posts);
        context.SaveChanges();

        // 4. Create Comments
        var comments = new List<Comment>
        {
            new Comment { Content = "Welcome to the platform!", PostId = posts[0].Id, UserId = users[1].Id, CreatedAt = DateTime.UtcNow.AddDays(-1) },
            new Comment { Content = "Nice photo!", PostId = posts[1].Id, UserId = users[2].Id, CreatedAt = DateTime.UtcNow.AddHours(-10) }
        };
        context.Comments.AddRange(comments);
        context.SaveChanges();

        // Reply
        var reply = new Comment { Content = "Thanks Jane!", PostId = posts[0].Id, UserId = users[0].Id, ParentCommentId = comments[0].Id, CreatedAt = DateTime.UtcNow.AddHours(-20) };
        context.Comments.Add(reply);

        // 5. Create Likes
        context.PostLikes.AddRange(
            new PostLike { PostId = posts[0].Id, UserId = users[1].Id },
            new PostLike { PostId = posts[0].Id, UserId = users[2].Id },
            new PostLike { PostId = posts[1].Id, UserId = users[2].Id }
        );

        context.SaveChanges();
    }
}
