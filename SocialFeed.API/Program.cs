using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SocialFeed.API.Data;

var builder = WebApplication.CreateBuilder(args);

// --- 1. Database ---
// This automatically reads "ConnectionStrings__DefaultConnection" from Render Env Vars
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// --- 2. JWT Authentication Configuration ---
var jwtSettings = builder.Configuration.GetSection("JwtSettings");
// We use a fallback key just in case, but Render should provide the real one
var keyString = jwtSettings["Key"] ?? "super_secret_fallback_key_for_dev_only_12345"; 
var secretKey = Encoding.UTF8.GetBytes(keyString);

builder.Services.AddAuthentication(options =>
    {
        options.DefaultAuthenticateScheme = JwtBearerDefaults.AuthenticationScheme;
        options.DefaultChallengeScheme = JwtBearerDefaults.AuthenticationScheme;
    })
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            // Validate the Key (Crucial)
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(secretKey),
            
            // Validate Lifetime (Token hasn't expired)
            ValidateLifetime = true,

            // Simplify for first deployment: Don't strictly check Issuer/Audience
            // This prevents "401 Unauthorized" errors if config is slightly off
            ValidateIssuer = false, 
            ValidateAudience = false 
        };
    });

// --- 3. CORS (UPDATED for Production) ---
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy => 
        policy
            .AllowAnyOrigin()  // Allows Vercel, Localhost, Mobile apps, etc.
            .AllowAnyMethod()
            .AllowAnyHeader());
});

// Register Services
builder.Services.AddScoped<SocialFeed.API.Services.IAuthService, SocialFeed.API.Services.AuthService>();
builder.Services.AddScoped<SocialFeed.API.Services.IPostService, SocialFeed.API.Services.PostService>();
builder.Services.AddScoped<SocialFeed.API.Services.IGcpStorageService, SocialFeed.API.Services.GcpStorageService>();

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// --- 4. Pipeline ---

// Apply Migrations at Startup (Simplifies deployment for this assessment)
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    dbContext.Database.Migrate();
    // Seed Data
    SocialFeed.API.Data.DataSeeder.Seed(dbContext);
}

// Enable Swagger in Production too (Optional, but helps you debug live)
app.UseSwagger();
app.UseSwaggerUI();

// USE THE NEW POLICY
app.UseCors("AllowAll");

app.UseStaticFiles();
app.UseAuthentication(); 
app.UseAuthorization();

app.UseHttpsRedirection();
app.MapControllers();

app.Run();