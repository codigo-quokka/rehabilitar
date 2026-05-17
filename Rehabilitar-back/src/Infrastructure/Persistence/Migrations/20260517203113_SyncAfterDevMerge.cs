using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SyncAfterDevMerge : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "FechaReserva",
                table: "Reservas",
                type: "TEXT",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "TipoCliente",
                table: "Reservas",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CupoEsperaOcupado",
                table: "Actividades",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<int>(
                name: "CupoOcupado",
                table: "Actividades",
                type: "INTEGER",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<Guid>(
                name: "Version",
                table: "Actividades",
                type: "TEXT",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"));
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FechaReserva",
                table: "Reservas");

            migrationBuilder.DropColumn(
                name: "TipoCliente",
                table: "Reservas");

            migrationBuilder.DropColumn(
                name: "CupoEsperaOcupado",
                table: "Actividades");

            migrationBuilder.DropColumn(
                name: "CupoOcupado",
                table: "Actividades");

            migrationBuilder.DropColumn(
                name: "Version",
                table: "Actividades");
        }
    }
}
