import { MigrationInterface, QueryRunner } from "typeorm";

export class UseLocalAssets1740000000001 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        // Mapping of team name to local asset slug
        const ASSET_MAP: Record<string, string> = {
            // Pot 1
            "Real Madrid": "real-madrid",
            "Manchester City": "manchester-city",
            "Bayern Munich": "bayern-munich",
            "Bayern München": "bayern-munich",
            "Paris Saint-Germain": "paris-saint-germain",
            "PSG": "paris-saint-germain",
            "Paris": "paris-saint-germain",
            "Liverpool": "liverpool",
            "Inter Milan": "inter-milan",
            "Inter": "inter-milan",
            "Dortmund": "dortmund",
            "Borussia Dortmund": "dortmund",
            "RB Leipzig": "rb-leipzig",
            "Leipzig": "rb-leipzig",
            "Barcelona": "barcelona",
            "FC Barcelona": "barcelona",

            // Pot 2
            "Bayer Leverkusen": "bayer-leverkusen",
            "Leverkusen": "bayer-leverkusen",
            "Atletico Madrid": "atletico-madrid",
            "Atlético de Madrid": "atletico-madrid",
            "Atalanta": "atalanta",
            "Juventus": "juventus",
            "Benfica": "benfica",
            "Arsenal": "arsenal",
            "Club Brugge": "club-brugge",
            "Shakhtar Donetsk": "shakhtar-donetsk",
            "AC Milan": "ac-milan",
            "Milan": "ac-milan",

            // Pot 3
            "Feyenoord": "feyenoord",
            "Sporting CP": "sporting-cp",
            "Sporting Lisbon": "sporting-cp",
            "PSV": "psv",
            "Dinamo Zagreb": "dinamo-zagreb",
            "Salzburg": "salzburg",
            "Lille": "lille",
            "Crvena Zvezda": "red-star-belgrade",
            "Red Star Belgrade": "red-star-belgrade",
            "Young Boys": "young-boys",
            "Celtic": "celtic",

            // Pot 4
            "Slovan Bratislava": "slovan-bratislava",
            "Monaco": "monaco",
            "AS Monaco": "monaco",
            "Sparta Prague": "sparta-prague",
            "Aston Villa": "aston-villa",
            "Bologna": "bologna",
            "Girona": "girona",
            "Stuttgart": "stuttgart",
            "Sturm Graz": "sturm-graz",
            "Brest": "brest",
            "Stade Brestois": "brest",

            // Extras
            "Galatasaray": "galatasaray",
            "Bodø/Glimt": "bodo-glimt",
            "Bodø Glimt": "bodo-glimt",
            "Newcastle": "newcastle",
            "Olympiacos": "olympiacos",
            "Qarabağ": "qarabag"
        };

        for (const [name, slug] of Object.entries(ASSET_MAP)) {
             const localPath = `/assets/ucl/${slug}.svg`;
             // Update Home
             await queryRunner.query(`UPDATE matches SET "homeFlag" = '${localPath}' WHERE "homeTeam" ILIKE '%${name}%'`);
             // Update Away
             await queryRunner.query(`UPDATE matches SET "awayFlag" = '${localPath}' WHERE "awayTeam" ILIKE '%${name}%'`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // No revert
    }
}
