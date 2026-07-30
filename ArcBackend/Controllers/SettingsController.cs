using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ArcBackend.Data;
using ArcBackend.Models;

namespace ArcBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SettingsController : ControllerBase
    {
        private readonly ArcDbContext _db;

        public SettingsController(ArcDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetSettings()
        {
            var list = await _db.SystemSettings.ToListAsync();
            var dict = list.ToDictionary(s => s.Key, s => s.Value);
            return Ok(dict);
        }

        [HttpPut]
        public async Task<IActionResult> UpdateSettings([FromBody] Dictionary<string, object> settings)
        {
            foreach (var kvp in settings)
            {
                var valStr = kvp.Value?.ToString() ?? string.Empty;
                var existing = await _db.SystemSettings.FindAsync(kvp.Key);
                if (existing != null)
                {
                    existing.Value = valStr;
                }
                else
                {
                    _db.SystemSettings.Add(new SystemSetting { Key = kvp.Key, Value = valStr });
                }
            }

            await _db.SaveChangesAsync();
            return Ok(new { message = "Settings updated successfully." });
        }
    }
}
