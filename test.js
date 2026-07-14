const str = "2 hour session, single location, Full group photo + individual portraits, Sub group combinations (each family, the girls, the boys, etc.), 30 professionally edited photos, Professional colour grading, Online gallery delivery";
console.log(str.split(/,(?![^(]*\))/).map(s => s.trim()));
