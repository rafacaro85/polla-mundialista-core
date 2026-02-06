import { MigrationInterface, QueryRunner } from "typeorm";

export class FixUCLLogos1740000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const LOGO_MAP: Record<string, string> = {
            // Pot 1
            "Real Madrid": "https://crests.football-data.org/86.svg",
            "Manchester City": "https://crests.football-data.org/65.svg",
            "Bayern Munich": "https://crests.football-data.org/5.svg",
            "Bayern München": "https://crests.football-data.org/5.svg",
            "Paris Saint-Germain": "https://crests.football-data.org/524.svg",
            "PSG": "https://crests.football-data.org/524.svg",
            "Paris": "https://crests.football-data.org/524.svg",
            "Liverpool": "https://crests.football-data.org/64.svg",
            "Inter Milan": "https://crests.football-data.org/108.svg",
            "Inter": "https://crests.football-data.org/108.svg",
            "Dortmund": "https://crests.football-data.org/4.svg",
            "Borussia Dortmund": "https://crests.football-data.org/4.svg",
            "RB Leipzig": "https://crests.football-data.org/721.svg",
            "Leipzig": "https://crests.football-data.org/721.svg",
            "Barcelona": "https://crests.football-data.org/81.svg",
            "FC Barcelona": "https://crests.football-data.org/81.svg",

            // Pot 2
            "Bayer Leverkusen": "https://crests.football-data.org/3.svg",
            "Leverkusen": "https://crests.football-data.org/3.svg",
            "Atletico Madrid": "https://crests.football-data.org/78.svg",
            "Atlético de Madrid": "https://crests.football-data.org/78.svg",
            "Atalanta": "https://crests.football-data.org/102.svg",
            "Juventus": "https://crests.football-data.org/109.svg",
            "Benfica": "https://crests.football-data.org/1903.svg",
            "Arsenal": "https://crests.football-data.org/57.svg",
            "Club Brugge": "https://crests.football-data.org/312.svg",
            "Shakhtar Donetsk": "https://upload.wikimedia.org/wikipedia/en/a/a1/FC_Shakhtar_Donetsk.svg",
            "AC Milan": "https://crests.football-data.org/98.svg",
            "Milan": "https://crests.football-data.org/98.svg",

            // Pot 3
            "Feyenoord": "https://crests.football-data.org/675.svg",
            "Sporting CP": "https://crests.football-data.org/498.svg",
            "Sporting Lisbon": "https://crests.football-data.org/498.svg",
            "PSV": "https://crests.football-data.org/674.svg",
            "Dinamo Zagreb": "https://upload.wikimedia.org/wikipedia/commons/2/23/NK_Dinamo_Zagreb.svg",
            "Salzburg": "https://crests.football-data.org/1877.svg",
            "Lille": "https://crests.football-data.org/521.svg",
            "Crvena Zvezda": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Red_Star_Belgrade_logo.svg",
            "Red Star Belgrade": "https://upload.wikimedia.org/wikipedia/commons/c/c5/Red_Star_Belgrade_logo.svg",
            "Young Boys": "https://crests.football-data.org/1871.svg",
            "Celtic": "https://crests.football-data.org/732.svg",

            // Pot 4
            "Slovan Bratislava": "https://upload.wikimedia.org/wikipedia/commons/a/a2/ŠK_Slovan_Bratislava_logo.svg",
            "Monaco": "https://crests.football-data.org/548.svg",
            "AS Monaco": "https://crests.football-data.org/548.svg",
            "Sparta Prague": "https://crests.football-data.org/6200.svg",
            "Aston Villa": "https://crests.football-data.org/58.svg",
            "Bologna": "https://crests.football-data.org/103.svg",
            "Girona": "https://crests.football-data.org/298.svg",
            "Stuttgart": "https://crests.football-data.org/10.svg",
            "Sturm Graz": "https://crests.football-data.org/202.svg",
            "Brest": "https://crests.football-data.org/512.svg",
            "Stade Brestois": "https://crests.football-data.org/512.svg",

            // Extras
            "Galatasaray": "https://crests.football-data.org/610.svg",
            "Bodø/Glimt": "https://crests.football-data.org/444.svg",
            "Newcastle": "https://crests.football-data.org/67.svg",
            "Olympiacos": "https://crests.football-data.org/654.svg",
            "Qarabağ": "https://crests.football-data.org/5123.svg"
        };
        
        for (const [name, url] of Object.entries(LOGO_MAP)) {
             // Escape single quotes in URL just in case
             const safeUrl = url.replace(/'/g, "''");
             // Update Home
             await queryRunner.query(`UPDATE matches SET "homeFlag" = '${safeUrl}' WHERE "homeTeam" ILIKE '%${name}%'`);
             // Update Away
             await queryRunner.query(`UPDATE matches SET "awayFlag" = '${safeUrl}' WHERE "awayTeam" ILIKE '%${name}%'`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No reverting logic for massive update
    }
}
