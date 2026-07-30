using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ArcBackend.Data;
using ArcBackend.Models;

namespace ArcBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly ArcDbContext _db;

        public AuthController(ArcDbContext db)
        {
            _db = db;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest req)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
                {
                    return BadRequest(new { message = "Username and password are required." });
                }

                if (req.Password != "admin123")
                {
                    return Unauthorized(new { message = "Invalid password. Demo password is admin123." });
                }

                var username = req.Username.Trim().ToLower();
                var user = await _db.Users.FirstOrDefaultAsync(u => u.Username.ToLower() == username);

                // If user doesn't exist yet, auto-provision for seamless demo experience
                if (user == null)
                {
                    user = new User
                    {
                        Id = $"U-{Random.Shared.Next(100, 999)}",
                        Username = username,
                        Role = username.Contains("admin") ? "Super Admin" : "POS User",
                        Email = $"{username}@arc.navy.in",
                        Status = "Active",
                        LastLogin = DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss")
                    };
                    _db.Users.Add(user);
                }
                else
                {
                    user.LastLogin = DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss");
                }

                await _db.SaveChangesAsync();

                return Ok(new
                {
                    user.Id,
                    user.Username,
                    user.Role,
                    user.Email,
                    user.LastLogin,
                    Token = $"mock-jwt-token-{user.Id}-{DateTime.UtcNow.Ticks}"
                });
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = $"Authentication error: {ex.Message}" });
            }
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetUsers()
        {
            var users = await _db.Users.ToListAsync();
            return Ok(users);
        }

        [HttpPost("users")]
        public async Task<IActionResult> CreateUser([FromBody] User user)
        {
            if (await _db.Users.AnyAsync(u => u.Username.ToLower() == user.Username.ToLower()))
            {
                return BadRequest(new { message = "Username already exists." });
            }

            if (string.IsNullOrEmpty(user.Id))
            {
                user.Id = $"U-{Random.Shared.Next(100, 999)}";
            }

            _db.Users.Add(user);
            await _db.SaveChangesAsync();
            return Ok(user);
        }
    }
}
