using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ArcBackend.Data;
using ArcBackend.Models;

namespace ArcBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriesController : ControllerBase
    {
        private readonly ArcDbContext _db;

        public CategoriesController(ArcDbContext db)
        {
            _db = db;
        }

        // ─── Categories ──────────────────────────────────────────────────────────

        [HttpGet]
        public async Task<IActionResult> GetCategories()
        {
            var list = await _db.Categories.Include(c => c.SubCategories).OrderBy(c => c.Name).ToListAsync();
            return Ok(list);
        }

        [HttpPost]
        public async Task<IActionResult> CreateCategory([FromBody] CategoryMaster category)
        {
            if (string.IsNullOrWhiteSpace(category.Name))
            {
                return BadRequest(new { message = "Category Name is required." });
            }

            category.Name = category.Name.Trim().ToUpper();
            if (await _db.Categories.AnyAsync(c => c.Name == category.Name))
            {
                return BadRequest(new { message = "Category already exists." });
            }

            if (string.IsNullOrEmpty(category.Code))
            {
                category.Code = $"CAT-{Random.Shared.Next(10, 99)}";
            }

            _db.Categories.Add(category);
            await _db.SaveChangesAsync();
            return Ok(category);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateCategory(int id, [FromBody] CategoryMaster updated)
        {
            var existing = await _db.Categories.FindAsync(id);
            if (existing == null) return NotFound(new { message = "Category not found." });

            existing.Name = updated.Name.Trim().ToUpper();
            existing.Code = updated.Code;
            existing.Description = updated.Description;

            await _db.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteCategory(int id)
        {
            var existing = await _db.Categories.FindAsync(id);
            if (existing == null) return NotFound(new { message = "Category not found." });

            _db.Categories.Remove(existing);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Category deleted." });
        }

        // ─── Sub-Categories ──────────────────────────────────────────────────────

        [HttpPost("subcategories")]
        public async Task<IActionResult> CreateSubCategory([FromBody] SubCategoryMaster subCategory)
        {
            if (string.IsNullOrWhiteSpace(subCategory.Name) || subCategory.CategoryId <= 0)
            {
                return BadRequest(new { message = "SubCategory Name and CategoryId are required." });
            }

            subCategory.Name = subCategory.Name.Trim().ToUpper();
            var parentCat = await _db.Categories.FindAsync(subCategory.CategoryId);
            if (parentCat != null)
            {
                subCategory.CategoryName = parentCat.Name;
            }

            _db.SubCategories.Add(subCategory);
            await _db.SaveChangesAsync();
            return Ok(subCategory);
        }

        [HttpPut("subcategories/{id}")]
        public async Task<IActionResult> UpdateSubCategory(int id, [FromBody] SubCategoryMaster updated)
        {
            var existing = await _db.SubCategories.FindAsync(id);
            if (existing == null) return NotFound(new { message = "SubCategory not found." });

            existing.Name = updated.Name.Trim().ToUpper();
            existing.Description = updated.Description;
            if (updated.CategoryId > 0)
            {
                existing.CategoryId = updated.CategoryId;
                var parent = await _db.Categories.FindAsync(updated.CategoryId);
                if (parent != null) existing.CategoryName = parent.Name;
            }

            await _db.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("subcategories/{id}")]
        public async Task<IActionResult> DeleteSubCategory(int id)
        {
            var existing = await _db.SubCategories.FindAsync(id);
            if (existing == null) return NotFound(new { message = "SubCategory not found." });

            _db.SubCategories.Remove(existing);
            await _db.SaveChangesAsync();
            return Ok(new { message = "SubCategory deleted." });
        }

        // ─── Brands ──────────────────────────────────────────────────────────────
        [HttpGet("brands")]
        public async Task<IActionResult> GetBrands() => Ok(await _db.Brands.OrderBy(b => b.Name).ToListAsync());

        [HttpPost("brands")]
        public async Task<IActionResult> CreateBrand([FromBody] BrandMaster brand)
        {
            if (string.IsNullOrWhiteSpace(brand.Name)) return BadRequest(new { message = "Brand Name is required." });
            brand.Name = brand.Name.Trim().ToUpper();
            _db.Brands.Add(brand);
            await _db.SaveChangesAsync();
            return Ok(brand);
        }

        [HttpPut("brands/{id}")]
        public async Task<IActionResult> UpdateBrand(int id, [FromBody] BrandMaster updated)
        {
            var existing = await _db.Brands.FindAsync(id);
            if (existing == null) return NotFound(new { message = "Brand not found." });
            existing.Name = updated.Name.Trim().ToUpper();
            existing.CategoryName = updated.CategoryName;
            existing.Description = updated.Description;
            await _db.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("brands/{id}")]
        public async Task<IActionResult> DeleteBrand(int id)
        {
            var existing = await _db.Brands.FindAsync(id);
            if (existing == null) return NotFound(new { message = "Brand not found." });
            _db.Brands.Remove(existing);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Brand deleted." });
        }

        // ─── Ships / Units ───────────────────────────────────────────────────────
        [HttpGet("ships")]
        public async Task<IActionResult> GetShips() => Ok(await _db.ShipsUnits.OrderBy(s => s.Name).ToListAsync());

        [HttpPost("ships")]
        public async Task<IActionResult> CreateShip([FromBody] ShipUnitMaster ship)
        {
            if (string.IsNullOrWhiteSpace(ship.Name)) return BadRequest(new { message = "Ship / Unit Name is required." });
            ship.Name = ship.Name.Trim().ToUpper();
            _db.ShipsUnits.Add(ship);
            await _db.SaveChangesAsync();
            return Ok(ship);
        }

        [HttpPut("ships/{id}")]
        public async Task<IActionResult> UpdateShip(int id, [FromBody] ShipUnitMaster updated)
        {
            var existing = await _db.ShipsUnits.FindAsync(id);
            if (existing == null) return NotFound(new { message = "Ship/Unit not found." });
            existing.Name = updated.Name.Trim().ToUpper();
            existing.Command = updated.Command;
            existing.Status = updated.Status;
            await _db.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("ships/{id}")]
        public async Task<IActionResult> DeleteShip(int id)
        {
            var existing = await _db.ShipsUnits.FindAsync(id);
            if (existing == null) return NotFound(new { message = "Ship/Unit not found." });
            _db.ShipsUnits.Remove(existing);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Ship/Unit deleted." });
        }

        // ─── Ranks ───────────────────────────────────────────────────────────────
        [HttpGet("ranks")]
        public async Task<IActionResult> GetRanks() => Ok(await _db.Ranks.OrderBy(r => r.Name).ToListAsync());

        [HttpPost("ranks")]
        public async Task<IActionResult> CreateRank([FromBody] RankMaster rank)
        {
            if (string.IsNullOrWhiteSpace(rank.Name)) return BadRequest(new { message = "Rank Name is required." });
            rank.Name = rank.Name.Trim().ToUpper();
            _db.Ranks.Add(rank);
            await _db.SaveChangesAsync();
            return Ok(rank);
        }

        [HttpPut("ranks/{id}")]
        public async Task<IActionResult> UpdateRank(int id, [FromBody] RankMaster updated)
        {
            var existing = await _db.Ranks.FindAsync(id);
            if (existing == null) return NotFound(new { message = "Rank not found." });
            existing.Name = updated.Name.Trim().ToUpper();
            existing.Category = updated.Category;
            await _db.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("ranks/{id}")]
        public async Task<IActionResult> DeleteRank(int id)
        {
            var existing = await _db.Ranks.FindAsync(id);
            if (existing == null) return NotFound(new { message = "Rank not found." });
            _db.Ranks.Remove(existing);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Rank deleted." });
        }
    }
}
