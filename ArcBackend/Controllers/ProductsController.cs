using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ArcBackend.Data;
using ArcBackend.Models;

namespace ArcBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProductsController : ControllerBase
    {
        private readonly ArcDbContext _db;

        public ProductsController(ArcDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetProducts()
        {
            var products = await _db.Products.OrderBy(p => p.Name).ToListAsync();
            return Ok(products);
        }

        [HttpGet("{code}")]
        public async Task<IActionResult> GetProduct(string code)
        {
            var product = await _db.Products.FindAsync(code);
            if (product == null) return NotFound(new { message = "Product not found." });
            return Ok(product);
        }

        [HttpPost]
        public async Task<IActionResult> CreateProduct([FromBody] Product prod)
        {
            if (await _db.Products.AnyAsync(p => p.Code == prod.Code))
            {
                return BadRequest(new { message = "Product Code already exists." });
            }

            _db.Products.Add(prod);
            await _db.SaveChangesAsync();
            return Ok(prod);
        }

        [HttpPut("{code}")]
        public async Task<IActionResult> UpdateProduct(string code, [FromBody] Product prod)
        {
            var existing = await _db.Products.FindAsync(code);
            if (existing == null) return NotFound(new { message = "Product not found." });

            existing.Name = prod.Name;
            existing.Category = prod.Category;
            existing.Sub = prod.Sub;
            existing.Price = prod.Price;
            existing.AlertQty = prod.AlertQty;

            await _db.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("{code}")]
        public async Task<IActionResult> DeleteProduct(string code)
        {
            var existing = await _db.Products.FindAsync(code);
            if (existing == null) return NotFound(new { message = "Product not found." });

            _db.Products.Remove(existing);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Product deleted successfully." });
        }
    }
}
