using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ArcBackend.Models
{
    public class User
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string Username { get; set; } = string.Empty;
        public string Role { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public string Status { get; set; } = "Active";
        public string LastLogin { get; set; } = string.Empty;
    }

    public class Product
    {
        [Key]
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = string.Empty;
        public string Sub { get; set; } = string.Empty;
        public decimal Price { get; set; }
        public int Stock { get; set; }
        public int AlertQty { get; set; } = 10;
    }

    public class Sailor
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string PNo { get; set; } = string.Empty;
        public string Rank { get; set; } = string.Empty;
        public string Unit { get; set; } = string.Empty;
        public string Type { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Dob { get; set; } = string.Empty;
        public decimal RegRefund { get; set; }
        public decimal Balance { get; set; }
        public string Status { get; set; } = "Active";
    }

    public class Vendor
    {
        [Key]
        public string Id { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Contact { get; set; } = string.Empty;
        public string Mobile { get; set; } = string.Empty;
        public string Address { get; set; } = string.Empty;
        public string Gst { get; set; } = string.Empty;
    }

    public class StockEntry
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Vendor { get; set; } = string.Empty;
        public decimal PurchasePrice { get; set; }
        public decimal SalePrice { get; set; }
        public int PurchaseQty { get; set; }
        public string UnitType { get; set; } = string.Empty;
        public string PurchasedBy { get; set; } = string.Empty;
        public string PurchaseDate { get; set; } = string.Empty;
    }

    public class SalesOrder
    {
        [Key]
        public string BillNo { get; set; } = string.Empty;
        public string OrderNo { get; set; } = string.Empty;
        public string CustomerId { get; set; } = string.Empty;
        public string CustomerName { get; set; } = string.Empty;
        public string CustomerRank { get; set; } = string.Empty;
        public string CustomerUnit { get; set; } = string.Empty;
        public string CustomerType { get; set; } = string.Empty;
        public string ShipName { get; set; } = "Others";
        public decimal TotalAmount { get; set; }
        public string UserId { get; set; } = "superadmin";
        public string PosName { get; set; } = "POS-1";
        public string Date { get; set; } = string.Empty;
        
        public List<SalesOrderItem> Items { get; set; } = new();
    }

    public class SalesOrderItem
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string BillNo { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int Qty { get; set; }
        public decimal Price { get; set; }
        public string QtyType { get; set; } = string.Empty;
    }

    public class CardTransaction
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string CustomerId { get; set; } = string.Empty;
        public string TransactionNo { get; set; } = string.Empty;
        public string Type { get; set; } = "RECHARGE"; // RECHARGE, REFUND, REGISTRATION
        public decimal Amount { get; set; }
        public string Date { get; set; } = string.Empty;
        public string UserId { get; set; } = "superadmin";
        public string Remarks { get; set; } = string.Empty;
    }

    public class SystemSetting
    {
        [Key]
        public string Key { get; set; } = string.Empty;
        public string Value { get; set; } = string.Empty;
    }

    // DTOs
    public class LoginRequest
    {
        public string Username { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
    }

    public class CheckoutRequest
    {
        public string CardNumber { get; set; } = string.Empty;
        public string ShipName { get; set; } = "Others";
        public List<CartItemDto> Items { get; set; } = new();
    }

    public class CartItemDto
    {
        public string Code { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public int Qty { get; set; }
        public decimal Price { get; set; }
        public string QtyType { get; set; } = string.Empty;
    }

    public class CardActionRequest
    {
        public string SailorId { get; set; } = string.Empty;
        public decimal Amount { get; set; }
        public string Remarks { get; set; } = string.Empty;
    }

    public class CategoryMaster
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Code { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;

        public List<SubCategoryMaster> SubCategories { get; set; } = new();
    }

    public class SubCategoryMaster
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public int CategoryId { get; set; }
        public string CategoryName { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class BrandMaster
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string CategoryName { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
    }

    public class ShipUnitMaster
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Command { get; set; } = "Eastern Naval Command";
        public string Status { get; set; } = "Active";
    }

    public class RankMaster
    {
        [Key]
        [DatabaseGenerated(DatabaseGeneratedOption.Identity)]
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Category { get; set; } = "SAILOR";
    }
}
