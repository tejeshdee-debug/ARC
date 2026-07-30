using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ArcBackend.Data;
using ArcBackend.Models;

namespace ArcBackend.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class VendorsController : ControllerBase
    {
        private readonly ArcDbContext _db;

        public VendorsController(ArcDbContext db)
        {
            _db = db;
        }

        [HttpGet]
        public async Task<IActionResult> GetVendors()
        {
            var vendors = await _db.Vendors.ToListAsync();
            return Ok(vendors);
        }

        [HttpPost]
        public async Task<IActionResult> CreateVendor([FromBody] Vendor vendor)
        {
            if (string.IsNullOrEmpty(vendor.Id))
            {
                vendor.Id = $"V-{Random.Shared.Next(100, 999)}";
            }

            _db.Vendors.Add(vendor);
            await _db.SaveChangesAsync();
            return Ok(vendor);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateVendor(string id, [FromBody] Vendor vendor)
        {
            var existing = await _db.Vendors.FindAsync(id);
            if (existing == null) return NotFound(new { message = "Vendor not found." });

            existing.Name = vendor.Name;
            existing.Contact = vendor.Contact;
            existing.Mobile = vendor.Mobile;
            existing.Address = vendor.Address;
            existing.Gst = vendor.Gst;

            await _db.SaveChangesAsync();
            return Ok(existing);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteVendor(string id)
        {
            var existing = await _db.Vendors.FindAsync(id);
            if (existing == null) return NotFound(new { message = "Vendor not found." });

            _db.Vendors.Remove(existing);
            await _db.SaveChangesAsync();
            return Ok(new { message = "Vendor deleted." });
        }
    }
}
