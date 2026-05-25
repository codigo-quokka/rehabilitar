using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddInasistenciasConsecutivasCliente : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "DetallePago_MontoDescuento",
                table: "Reservas",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "PorcentajeDescuentoAplicado",
                table: "Reservas",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<decimal>(
                name: "DescuentoProximaReserva",
                table: "Clientes",
                type: "TEXT",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<int>(
                name: "InasistenciasConsecutivas",
                table: "Clientes",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "DetallePago_MontoDescuento",
                table: "Reservas");

            migrationBuilder.DropColumn(
                name: "PorcentajeDescuentoAplicado",
                table: "Reservas");

            migrationBuilder.DropColumn(
                name: "DescuentoProximaReserva",
                table: "Clientes");

            migrationBuilder.DropColumn(
                name: "InasistenciasConsecutivas",
                table: "Clientes");
        }
    }
}
