using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAptoFisico : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AptosFisicos",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    ClienteId = table.Column<Guid>(type: "TEXT", nullable: false),
                    NombreArchivo = table.Column<string>(type: "TEXT", maxLength: 255, nullable: false),
                    ContentType = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Archivo = table.Column<byte[]>(type: "BLOB", nullable: false),
                    Tamaño = table.Column<long>(type: "INTEGER", nullable: false),
                    Estado = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    FechaSubida = table.Column<DateTime>(type: "TEXT", nullable: false),
                    FechaEvaluacion = table.Column<DateTime>(type: "TEXT", nullable: true),
                    EvaluadoPor = table.Column<Guid>(type: "TEXT", nullable: true),
                    MotivoRechazo = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AptosFisicos", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AptosFisicos_Clientes_ClienteId",
                        column: x => x.ClienteId,
                        principalTable: "Clientes",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AptosFisicos_Users_EvaluadoPor",
                        column: x => x.EvaluadoPor,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AptosFisicos_ClienteId",
                table: "AptosFisicos",
                column: "ClienteId");

            migrationBuilder.CreateIndex(
                name: "IX_AptosFisicos_EvaluadoPor",
                table: "AptosFisicos",
                column: "EvaluadoPor");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AptosFisicos");
        }
    }
}
