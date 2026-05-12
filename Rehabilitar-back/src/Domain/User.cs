using Microsoft.AspNetCore.Identity;

namespace Domain;

public class User : IdentityUser<Guid>
{
    public string FirstName {get; private set;}
    public string LastName {get; private set;}

    // constructor vacío para EF Core.
    #nullable disable
    private User() { }
    #nullable enable

    private User(string firstName, string lastName, string email)
    {
        Id = Guid.NewGuid();
        FirstName = firstName;
        LastName = lastName;
        UserName = email;
        Email = email;
    }

    public static User Create(string firstName, string lastName, string email)
    {
        return new User(firstName, lastName, email);
    }

    public void UpdateInfo(string firstName, string lastName, string email)
    {
        FirstName = firstName;
        LastName = lastName;
        UserName = email;
        Email = email;
    }
}
