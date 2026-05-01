using Microsoft.AspNetCore.Identity;

namespace Domain;

public class Role : IdentityRole<Guid>
{
    
    public Role() : base() { }
    public Role(string roleName) : base(roleName) { }

}