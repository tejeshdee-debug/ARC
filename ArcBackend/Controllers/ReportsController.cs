using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ArcBackend.Data;

namespace ArcBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReportsController : ControllerBase
    {
        private readonly ArcDbContext _db;

        public ReportsController(ArcDbContext db)
        {
            _db = db;
        }

        [HttpGet("sales")]
        public async Task<IActionResult> GetSalesReport()
        {
            var orders = await _db.SalesOrders.Include(o => o.Items).OrderByDescending(o => o.Date).ToListAsync();
            
            var result = orders.SelectMany(o => o.Items.Select((item, idx) => new
            {
                billNo = o.BillNo,
                customerId = o.CustomerId,
                name = o.CustomerName,
                pNo = o.CustomerRank,
                category = o.CustomerType,
                item = item.Name,
                qty = item.Qty,
                price = item.Price,
                amount = item.Qty * item.Price,
                date = o.Date,
                type = "SALE"
            }));

            return Ok(result);
        }

        [HttpGet("console")]
        public async Task<IActionResult> GetConsoleReport()
        {
            var orders = await _db.SalesOrders.OrderByDescending(o => o.Date).ToListAsync();
            var consoleList = orders.Select((o, i) => new
            {
                sno = i + 1,
                billNo = $"SALE-{o.BillNo}",
                totalPrice = o.TotalAmount,
                userId = o.UserId,
                date = o.Date,
                posName = o.PosName
            });
            return Ok(consoleList);
        }

        [HttpGet("summary")]
        public async Task<IActionResult> GetSalesSummary()
        {
            var items = await _db.SalesOrderItems.ToListAsync();
            var summary = items.GroupBy(i => i.Name).Select((g, idx) => new
            {
                sno = idx + 1,
                productName = g.Key,
                shipName = "Others",
                saleQty = g.Sum(x => x.Qty),
                subCategory = g.First().QtyType,
                price = g.First().Price
            });
            return Ok(summary);
        }
    }
}
