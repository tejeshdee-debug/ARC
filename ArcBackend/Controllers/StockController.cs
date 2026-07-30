using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ArcBackend.Data;
using ArcBackend.Models;

namespace ArcBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class StockController : ControllerBase
    {
        private readonly ArcDbContext _db;

        public StockController(ArcDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetStockEntries()
        {
            var entries = await _db.StockEntries.OrderByDescending(s => s.Id).ToListAsync();
            return Ok(entries);
        }

        [HttpPost]
        public async Task<IActionResult> AddStock([FromBody] StockEntry entry)
        {
            if (string.IsNullOrEmpty(entry.Code) || entry.PurchaseQty <= 0)
            {
                return BadRequest(new { message = "Valid product code and purchase quantity required." });
            }

            var prod = await _db.Products.FindAsync(entry.Code);
            if (prod == null)
            {
                return BadRequest(new { message = "Product not found." });
            }

            entry.Name = prod.Name;
            entry.PurchaseDate = DateTime.Now.ToString("dd/MM/yyyy");

            _db.StockEntries.Add(entry);

            // Update product live stock & sale price
            prod.Stock += entry.PurchaseQty;
            if (entry.SalePrice > 0)
            {
                prod.Price = entry.SalePrice;
            }

            await _db.SaveChangesAsync();
            return Ok(entry);
        }
    }
}
