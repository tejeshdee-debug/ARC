using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ArcBackend.Data;
using ArcBackend.Models;

namespace ArcBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SailorsController : ControllerBase
    {
        private readonly ArcDbContext _db;

        public SailorsController(ArcDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetSailors([FromQuery] string? search)
        {
            var query = _db.Sailors.AsQueryable();
            if (!string.IsNullOrWhiteSpace(search))
            {
                var q = search.Trim().ToLower();
                query = query.Where(s => s.Id.ToLower().Contains(q) || s.Name.ToLower().Contains(q) || s.PNo.ToLower().Contains(q) || s.Mobile.Contains(q));
            }
            var sailors = await query.ToListAsync();
            return Ok(sailors);
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetSailor(string id)
        {
            var sailor = await _db.Sailors.FirstOrDefaultAsync(s => s.Id == id || s.PNo == id || s.Mobile == id);
            if (sailor == null) return NotFound(new { message = "Sailor not found." });
            return Ok(sailor);
        }

        [HttpPost]
        public async Task<IActionResult> CreateSailor([FromBody] Sailor sailor)
        {
            if (await _db.Sailors.AnyAsync(s => s.PNo == sailor.PNo))
            {
                return BadRequest(new { message = "Sailor with this P.No already exists." });
            }

            if (string.IsNullOrEmpty(sailor.Id))
            {
                sailor.Id = $"000{Random.Shared.Next(1000000, 9999999)}";
            }

            sailor.Balance = sailor.RegRefund;
            sailor.Status = "Active";

            _db.Sailors.Add(sailor);

            // Record registration deposit
            _db.CardTransactions.Add(new CardTransaction
            {
                CustomerId = sailor.Id,
                TransactionNo = $"REG-{Guid.NewGuid().ToString("N")[..8].ToUpper()}",
                Type = "REGISTRATION",
                Amount = sailor.RegRefund,
                Date = DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss"),
                Remarks = "Card Registration Deposit"
            });

            await _db.SaveChangesAsync();
            return Ok(sailor);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateSailor(string id, [FromBody] Sailor sailor)
        {
            var existing = await _db.Sailors.FindAsync(id);
            if (existing == null) return NotFound(new { message = "Sailor not found." });

            existing.Name = sailor.Name;
            existing.Rank = sailor.Rank;
            existing.Unit = sailor.Unit;
            existing.Type = sailor.Type;
            existing.Address = sailor.Address;
            existing.Mobile = sailor.Mobile;
            existing.Dob = sailor.Dob;
            existing.Status = sailor.Status;

            await _db.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteSailor(string id)
        {
            var existing = await _db.Sailors.FindAsync(id);
            if (existing == null) return NotFound(new { message = "Sailor not found." });

            _db.Sailors.Remove(existing);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Sailor deleted." });
        }
    }
}
