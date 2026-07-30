using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ArcBackend.Data;
using ArcBackend.Models;

namespace ArcBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CardsController : ControllerBase
    {
        private readonly ArcDbContext _db;

        public CardsController(ArcDbContext db)
        {
            _db = db;
        }

        [HttpPost("recharge")]
        public async Task<IActionResult> RechargeCard([FromBody] CardActionRequest req)
        {
            if (req.Amount <= 0)
            {
                return BadRequest(new { message = "Amount must be greater than zero." });
            }

            var sailor = await _db.Sailors.FirstOrDefaultAsync(s => s.Id == req.SailorId || s.PNo == req.SailorId);
            if (sailor == null)
            {
                return NotFound(new { message = "Sailor not found." });
            }

            sailor.Balance += req.Amount;

            var tx = new CardTransaction
            {
                CustomerId = sailor.Id,
                TransactionNo = $"RCH-{Guid.NewGuid().ToString("N")[..8].ToUpper()}",
                Type = "RECHARGE",
                Amount = req.Amount,
                Date = DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss"),
                Remarks = string.IsNullOrEmpty(req.Remarks) ? "Card Recharge" : req.Remarks
            };

            _db.CardTransactions.Add(tx);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Successfully recharged ₹{req.Amount:F2} for {sailor.Name}",
                newBalance = sailor.Balance,
                transactionNo = tx.TransactionNo
            });
        }

        [HttpPost("refund")]
        public async Task<IActionResult> RefundCard([FromBody] CardActionRequest req)
        {
            var sailor = await _db.Sailors.FirstOrDefaultAsync(s => s.Id == req.SailorId || s.PNo == req.SailorId);
            if (sailor == null)
            {
                return NotFound(new { message = "Sailor not found." });
            }

            var refundAmount = sailor.Balance + sailor.RegRefund;
            sailor.Balance = 0;
            sailor.Status = "Deactive";

            var tx = new CardTransaction
            {
                CustomerId = sailor.Id,
                TransactionNo = $"RFD-{Guid.NewGuid().ToString("N")[..8].ToUpper()}",
                Type = "REFUND",
                Amount = refundAmount,
                Date = DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss"),
                Remarks = string.IsNullOrEmpty(req.Remarks) ? "Card Deactivated & Deposit Refunded" : req.Remarks
            };

            _db.CardTransactions.Add(tx);
            await _db.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = $"Card deactivated and ₹{refundAmount:F2} refunded to {sailor.Name}",
                refundAmount,
                status = sailor.Status,
                transactionNo = tx.TransactionNo
            });
        }

        [HttpGet("transactions")]
        public async Task<IActionResult> GetTransactions([FromQuery] string? customerId)
        {
            var query = _db.CardTransactions.AsQueryable();
            if (!string.IsNullOrEmpty(customerId))
            {
                query = query.Where(t => t.CustomerId == customerId);
            }
            var list = await query.OrderByDescending(t => t.Id).ToListAsync();
            return Ok(list);
        }
    }
}
