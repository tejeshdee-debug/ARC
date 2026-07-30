using Microsoft.EntityFrameworkCore;
using ArcBackend.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Configure PostgreSQL DbContext
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? "Host=localhost;Port=5432;Database=arc_pos_db;Username=postgres;Password=postgres";

builder.Services.AddDbContext<ArcDbContext>(options =>
    options.UseNpgsql(connectionString));

// Configure CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:5174", "http://localhost:5173", "http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

var app = builder.Build();

// Enable CORS
app.UseCors("AllowFrontend");

app.UseAuthorization();
app.MapControllers();

// Auto-migrate & seed PostgreSQL database on startup
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<ArcDbContext>();
        context.SeedInitialData();
        Console.WriteLine("[ArcBackend] PostgreSQL database 'arc_pos_db' connected and seeded successfully.");
    }
    catch (Exception ex)
    {
        Console.WriteLine($"[ArcBackend Error] Failed to initialize PostgreSQL database: {ex.Message}");
    }
}

app.Run("http://localhost:5000");
