using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RL.Data.Migrations
{
    public partial class InitialCreate : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Plans",
                columns: table => new
                {
                    PlanId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    CreateDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Plans", x => x.PlanId);
                });

            migrationBuilder.CreateTable(
                name: "Procedures",
                columns: table => new
                {
                    ProcedureId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    ProcedureTitle = table.Column<string>(type: "TEXT", nullable: true),
                    CreateDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Procedures", x => x.ProcedureId);
                });

            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    UserId = table.Column<int>(type: "INTEGER", nullable: false)
                        .Annotation("Sqlite:Autoincrement", true),
                    Name = table.Column<string>(type: "TEXT", nullable: true),
                    CreateDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Users", x => x.UserId);
                });

            migrationBuilder.CreateTable(
                name: "PlanProcedures",
                columns: table => new
                {
                    ProcedureId = table.Column<int>(type: "INTEGER", nullable: false),
                    PlanId = table.Column<int>(type: "INTEGER", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanProcedures", x => new { x.PlanId, x.ProcedureId });
                    table.ForeignKey(
                        name: "FK_PlanProcedures_Plans_PlanId",
                        column: x => x.PlanId,
                        principalTable: "Plans",
                        principalColumn: "PlanId",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlanProcedures_Procedures_ProcedureId",
                        column: x => x.ProcedureId,
                        principalTable: "Procedures",
                        principalColumn: "ProcedureId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PlanProcedureUsers",
                columns: table => new
                {
                    PlanId = table.Column<int>(type: "INTEGER", nullable: false),
                    ProcedureId = table.Column<int>(type: "INTEGER", nullable: false),
                    UserId = table.Column<int>(type: "INTEGER", nullable: false),
                    CreateDate = table.Column<DateTime>(type: "TEXT", nullable: false),
                    UpdateDate = table.Column<DateTime>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PlanProcedureUsers", x => new { x.PlanId, x.ProcedureId, x.UserId });
                    table.ForeignKey(
                        name: "FK_PlanProcedureUsers_PlanProcedures_PlanId_ProcedureId",
                        columns: x => new { x.PlanId, x.ProcedureId },
                        principalTable: "PlanProcedures",
                        principalColumns: new[] { "PlanId", "ProcedureId" },
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PlanProcedureUsers_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "UserId",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.InsertData(
                table: "Procedures",
                columns: new[] { "ProcedureId", "CreateDate", "ProcedureTitle", "UpdateDate" },
                values: new object[] { 1, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Procedure 1", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) });

            migrationBuilder.InsertData(
                table: "Procedures",
                columns: new[] { "ProcedureId", "CreateDate", "ProcedureTitle", "UpdateDate" },
                values: new object[] { 2, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Procedure 2", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) });

            migrationBuilder.InsertData(
                table: "Procedures",
                columns: new[] { "ProcedureId", "CreateDate", "ProcedureTitle", "UpdateDate" },
                values: new object[] { 3, new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified), "Procedure 3", new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified) });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "UserId", "CreateDate", "Name", "UpdateDate" },
                values: new object[] { 1, new DateTime(2026, 4, 7, 9, 32, 49, 722, DateTimeKind.Utc).AddTicks(7805), "Nick Morrison", new DateTime(2026, 4, 7, 9, 32, 49, 722, DateTimeKind.Utc).AddTicks(7807) });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "UserId", "CreateDate", "Name", "UpdateDate" },
                values: new object[] { 2, new DateTime(2026, 4, 7, 9, 32, 49, 722, DateTimeKind.Utc).AddTicks(7810), "Scott Cassidy", new DateTime(2026, 4, 7, 9, 32, 49, 722, DateTimeKind.Utc).AddTicks(7811) });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "UserId", "CreateDate", "Name", "UpdateDate" },
                values: new object[] { 3, new DateTime(2026, 4, 7, 9, 32, 49, 722, DateTimeKind.Utc).AddTicks(7812), "Tony Bidner", new DateTime(2026, 4, 7, 9, 32, 49, 722, DateTimeKind.Utc).AddTicks(7813) });

            migrationBuilder.InsertData(
                table: "Users",
                columns: new[] { "UserId", "CreateDate", "Name", "UpdateDate" },
                values: new object[] { 4, new DateTime(2026, 4, 7, 9, 32, 49, 722, DateTimeKind.Utc).AddTicks(7814), "Patryk Skwarko", new DateTime(2026, 4, 7, 9, 32, 49, 722, DateTimeKind.Utc).AddTicks(7815) });

            migrationBuilder.CreateIndex(
                name: "IX_PlanProcedures_ProcedureId",
                table: "PlanProcedures",
                column: "ProcedureId");

            migrationBuilder.CreateIndex(
                name: "IX_PlanProcedureUsers_UserId",
                table: "PlanProcedureUsers",
                column: "UserId");
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PlanProcedureUsers");

            migrationBuilder.DropTable(
                name: "PlanProcedures");

            migrationBuilder.DropTable(
                name: "Users");

            migrationBuilder.DropTable(
                name: "Plans");

            migrationBuilder.DropTable(
                name: "Procedures");
        }
    }
}
