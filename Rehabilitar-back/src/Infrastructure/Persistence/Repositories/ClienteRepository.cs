using Application.Clientes;
using Domain.Clientes;

namespace Infrastructure.Persistence.Repositories;

public class ClienteRepository : RepositoryBase<Cliente>, IClienteRepository
{
    public ClienteRepository(RehabilitarDbContext context) : base(context) { }
}
