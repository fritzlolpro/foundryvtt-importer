// Тест case-insensitive парсинга - все в нижнем регистре
export const LOWERCASE_CREATURE = `goblin warrior creature 0
small humanoid goblin
perception +3; darkvision
languages goblin
skills acrobatics +5, stealth +5
str +0, dex +3, con +1, int +0, wis +1, cha -1
ac 16; fort +5, ref +7, will +3
hp 6
speed 25 feet`;

// Тест case-insensitive парсинга - все в верхнем регистре
export const UPPERCASE_CREATURE = `GOBLIN SNIPER CREATURE 1
SMALL HUMANOID GOBLIN
PERCEPTION +5; DARKVISION
LANGUAGES GOBLIN
SKILLS ACROBATICS +7, STEALTH +7
STR +0, DEX +4, CON +2, INT +0, WIS +2, CHA +0
AC 17; FORT +6, REF +8, WILL +4
HP 16
SPEED 25 FEET`;

// Тест case-insensitive парсинга - смешанный регистр
export const MIXED_CASE_CREATURE = `GoBLiN BoSs CrEaTuRe 1
SmAlL HuMaNoId GoBLiN
PeRcEpTiOn +6; DaRkViSiOn
LaNgUaGeS gObLiN, cOmMoN
SkIlLs AcRoBaTiCs +6, StEaLtH +6, InTiMiDaTiOn +5
sTr +2, DeX +3, cOn +2, iNt +0, wIs +1, ChA +1
Ac 17; FoRt +7, ReF +8, WiLl +4
Hp 16
SpEeD 25 FeEt`;
