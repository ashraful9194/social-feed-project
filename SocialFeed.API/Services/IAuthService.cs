using SocialFeed.API.DTOs;
using SocialFeed.API.Entities;

namespace SocialFeed.API.Services;

public interface IAuthService
{
    Task<AuthResponse> RegisterAsync(RegisterRequest request);
    Task<AuthResponse> LoginAsync(LoginRequest request);
    string GenerateJwtToken(User user);
    bool IsStrongPassword(string password);
}

