# --- FIX: Use .NET 9.0 SDK ---
    FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
    WORKDIR /src
    
    # Copy the solution file and project files
    COPY ["SocialFeed.sln", "./"]
    COPY ["SocialFeed.API/SocialFeed.API.csproj", "SocialFeed.API/"]
    
    # Restore dependencies
    RUN dotnet restore "SocialFeed.sln"
    
    # Copy the rest of the source code
    COPY . .
    
    # Build and publish the app
    WORKDIR "/src/SocialFeed.API"
    RUN dotnet publish -c Release -o /app/publish
    
    # --- FIX: Use .NET 9.0 Runtime ---
    FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
    WORKDIR /app
    COPY --from=build /app/publish .
    ENTRYPOINT ["dotnet", "SocialFeed.API.dll"]