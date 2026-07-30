using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ArcBackend.Data;
using ArcBackend.Models;

namespace ArcBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PosController : ControllerBase
    {
        private readonly ArcDbContext _db;

        public PosController(ArcDbContext db)
        {
            _db = db;
        }

        [HttpPost("checkout")]
        public async Task<IActionResult> Checkout([FromBody] CheckoutRequest req)
        {
            if (req.Items == null || !req.Items.Any())
            {
                return BadRequest(new { message = "Cart is empty." });
            }

            var cardNo = req.CardNumber?.Trim();
            if (string.IsNullOrEmpty(cardNo))
            {
                return BadRequest(new { message = "Card number / Sailor ID is required." });
            }

            // Find sailor
            var sailor = await _db.Sailors.FirstOrDefaultAsync(s => s.Id == cardNo || s.PNo == cardNo || s.Mobile == cardNo);
            if (sailor == null)
            {
                return BadRequest(new { message = "Card not found. Check Sailor ID, P.No or Mobile." });
            }

            if (sailor.Status == "Deactive")
            {
                return BadRequest(new { message = "Card is DEACTIVATED. Transaction blocked." });
            }

            if (sailor.Status == "Lost")
            {
                return BadRequest(new { message = "Card is reported LOST. Transaction blocked." });
            }

            var grandTotal = req.Items.Sum(i => i.Qty * i.Price);

            if (grandTotal > sailor.Balance)
            {
                return BadRequest(new { message = $"Insufficient balance! Required: ₹{grandTotal:F2}, Available: ₹{sailor.Balance:F2}" });
            }

            // Execute inside PostgreSQL Transaction for atomicity
            using var transaction = await _db.Database.BeginTransactionAsync();
            try
            {
                // Verify stock availability
                foreach (var item in req.Items)
                {
                    var prod = await _db.Products.FirstOrDefaultAsync(p => p.Code == item.Code);
                    if (prod == null || prod.Stock < item.Qty)
                    {
                        await transaction.RollbackAsync();
                        return BadRequest(new { message = $"Out of stock for item '{item.Name}'. Available: {prod?.Stock ?? 0}" });
                    }
                    prod.Stock -= item.Qty;
                }

                // Deduct sailor balance
                sailor.Balance -= grandTotal;

                var billNo = $"TRN{Random.Shared.Next(1000000000, 1999999999)}";
                var orderNo = $"ORD-{Random.Shared.Next(100000, 999999)}";
                var dateStr = DateTime.Now.ToString("dd/MM/yyyy HH:mm:ss");

                var salesOrder = new SalesOrder
                {
                    BillNo = billNo,
                    OrderNo = orderNo,
                    CustomerId = sailor.Id,
                    CustomerName = sailor.Name,
                    CustomerRank = sailor.Rank,
                    CustomerUnit = sailor.Unit,
                    CustomerType = sailor.Type,
                    ShipName = string.IsNullOrEmpty(req.ShipName) ? "Others" : req.ShipName,
                    TotalAmount = grandTotal,
                    UserId = "superadmin",
                    PosName = "POS-1",
                    Date = dateStr,
                    Items = req.Items.Select(i => new SalesOrderItem
                    {
                        BillNo = billNo,
                        Code = i.Code,
                        Name = i.Name,
                        Qty = i.Qty,
                        Price = i.Price,
                        QtyType = i.QtyType
                    }).ToList()
                };

                _db.SalesOrders.Add(salesOrder);

                await _db.SaveChangesAsync();
                await transaction.CommitAsync();

                return Ok(new
                {
                    success = true,
                    billNo,
                    orderNo,
                    total = grandTotal,
                    remainingBalance = sailor.Balance,
                    date = dateStr,
                    sailor = new
                    {
                        sailor.Id,
                        sailor.Name,
                        sailor.Rank,
                        sailor.Unit,
                        sailor.Type,
                        sailor.Balance
                    },
                    items = req.Items
                });
            }
            catch (Exception ex)
            {
                await transaction.RollbackAsync();
                return StatusCode(500, new { message = $"Transaction error: {ex.Message}" });
            }
        }
    }
}
