using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using SocialFeed.API.DTOs;

namespace SocialFeed.API.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class UploadsController : ControllerBase
{
    private static readonly string[] AllowedExtensions = [".jpg", ".jpeg", ".png", ".gif", ".webp"];
    private const long MaxFileSize = 5 * 1024 * 1024; // 5 MB
    private readonly IWebHostEnvironment _environment;

    public UploadsController(IWebHostEnvironment environment)
    {
        _environment = environment;
    }

    [HttpPost("post-image")]
    [RequestSizeLimit(MaxFileSize)]
    public async Task<ActionResult<UploadResponse>> UploadPostImage([FromForm] IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            return BadRequest("File is required.");
        }

        if (file.Length > MaxFileSize)
        {
            return BadRequest("File exceeds 5 MB limit.");
        }

        var extension = Path.GetExtension(file.FileName).ToLowerInvariant();
        if (!AllowedExtensions.Contains(extension))
        {
            return BadRequest("Only JPG, PNG, GIF, and WEBP are allowed.");
        }

        var uploadsRoot = GetUploadsFolder();
        Directory.CreateDirectory(uploadsRoot);

        var fileName = $"{Guid.NewGuid():N}{extension}";
        var physicalPath = Path.Combine(uploadsRoot, fileName);

        await using var stream = System.IO.File.Create(physicalPath);
        await file.CopyToAsync(stream);

        var relativePath = $"/uploads/{fileName}";
        var publicUrl = BuildPublicUrl(relativePath);
        return Ok(new UploadResponse(publicUrl, file.FileName, file.Length));
    }

    private string GetUploadsFolder()
    {
        var webRoot = _environment.WebRootPath;
        if (string.IsNullOrEmpty(webRoot))
        {
            webRoot = Path.Combine(_environment.ContentRootPath, "wwwroot");
        }
        return Path.Combine(webRoot, "uploads");
    }

    private string BuildPublicUrl(string relativePath)
    {
        var host = $"{Request.Scheme}://{Request.Host.Value}";
        return $"{host}{relativePath}";
    }
}

