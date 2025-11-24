using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SocialFeed.API.Data;
using SocialFeed.API.DTOs;
using SocialFeed.API.Entities;

namespace SocialFeed.API.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;
    private static readonly string[] DefaultProfileImages =
    [
        "/assets/images/card_ppl1.png",
        "/assets/images/card_ppl2.png",
        "/assets/images/card_ppl3.png",
        "/assets/images/card_ppl4.png",
        "/assets/images/Avatar.png"
    ];

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        // Check if user exists
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
        {
            throw new InvalidOperationException("User with this email already exists.");
        }

        if (!IsStrongPassword(request.Password))
        {
            throw new ArgumentException("Password must be at least 8 characters and contain uppercase, lowercase, number, and special character.");
        }

        // Hash password
        var passwordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);

        // Create User
        var user = new User
        {
            FirstName = request.FirstName,
            LastName = request.LastName,
            Email = request.Email,
            PasswordHash = passwordHash,
            ProfileImageUrl = PickRandomProfileImage()
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Generate Token & Return
        var token = GenerateJwtToken(user);
        return new AuthResponse(token, user.Email, $"{user.FirstName} {user.LastName}", ResolveAvatar(user.ProfileImageUrl));
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        // Find User
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null)
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        // Verify Password
        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
        {
            throw new UnauthorizedAccessException("Invalid email or password.");
        }

        // Generate Token & Return
        var token = GenerateJwtToken(user);
        return new AuthResponse(token, user.Email, $"{user.FirstName} {user.LastName}", ResolveAvatar(user.ProfileImageUrl));
    }

    public string GenerateJwtToken(User user)
    {
        var jwtSettings = _configuration.GetSection("JwtSettings");
        var key = Encoding.UTF8.GetBytes(jwtSettings["Key"]!);

        var claims = new List<Claim>
        {
            new(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Email, user.Email),
            new(ClaimTypes.Name, $"{user.FirstName} {user.LastName}")
        };

        var tokenDescriptor = new SecurityTokenDescriptor
        {
            Subject = new ClaimsIdentity(claims),
            Expires = DateTime.UtcNow.AddDays(7),
            Issuer = jwtSettings["Issuer"],
            Audience = jwtSettings["Audience"],
            SigningCredentials = new SigningCredentials(new SymmetricSecurityKey(key), SecurityAlgorithms.HmacSha256Signature)
        };

        var tokenHandler = new JwtSecurityTokenHandler();
        var token = tokenHandler.CreateToken(tokenDescriptor);
        return tokenHandler.WriteToken(token);
    }

    public bool IsStrongPassword(string password)
    {
        if (string.IsNullOrWhiteSpace(password) || password.Length < 8) return false;
        var hasUpper = password.Any(char.IsUpper);
        var hasLower = password.Any(char.IsLower);
        var hasDigit = password.Any(char.IsDigit);
        var hasSpecial = password.Any(ch => !char.IsLetterOrDigit(ch));
        return hasUpper && hasLower && hasDigit && hasSpecial;
    }

    private static string PickRandomProfileImage()
    {
        return DefaultProfileImages[Random.Shared.Next(DefaultProfileImages.Length)];
    }

    private static string ResolveAvatar(string? avatarPath)
    {
        return string.IsNullOrWhiteSpace(avatarPath) ? "/assets/images/Avatar.png" : avatarPath;
    }
}

