const C3 = self.C3;
self.C3_GetObjectRefTable = function () {
	return [
		C3.Plugins.Sprite,
		C3.Plugins.video
	];
};
self.C3_JsPropNameTable = [
	{fon: 0},
	{fon2: 0},
	{songtime: 0},
	{wedo: 0},
	{btn_start: 0},
	{btn_kategori: 0},
	{btn_ekrankucult: 0},
	{btn_ekrankapla: 0},
	{btn_secac: 0},
	{btn_seskapat: 0},
	{btn_info: 0},
	{btn_kapat: 0},
	{choose1: 0},
	{btn_karaoke: 0},
	{btn_listen: 0},
	{song2: 0},
	{referansyazi: 0},
	{gamesbutons: 0},
	{btn_references: 0},
	{btn_home: 0},
	{listen1: 0},
	{btn_play: 0},
	{btn_pause: 0},
	{sing1: 0},
	{Videolisten: 0},
	{Videokaraoke: 0},
	{butons: 0}
];

self.InstanceType = {
	fon: class extends self.ISpriteInstance {},
	fon2: class extends self.ISpriteInstance {},
	songtime: class extends self.ISpriteInstance {},
	wedo: class extends self.ISpriteInstance {},
	btn_start: class extends self.ISpriteInstance {},
	btn_kategori: class extends self.ISpriteInstance {},
	btn_ekrankucult: class extends self.ISpriteInstance {},
	btn_ekrankapla: class extends self.ISpriteInstance {},
	btn_secac: class extends self.ISpriteInstance {},
	btn_seskapat: class extends self.ISpriteInstance {},
	btn_info: class extends self.ISpriteInstance {},
	btn_kapat: class extends self.ISpriteInstance {},
	choose1: class extends self.ISpriteInstance {},
	btn_karaoke: class extends self.ISpriteInstance {},
	btn_listen: class extends self.ISpriteInstance {},
	song2: class extends self.ISpriteInstance {},
	referansyazi: class extends self.ISpriteInstance {},
	gamesbutons: class extends self.ISpriteInstance {},
	btn_references: class extends self.ISpriteInstance {},
	btn_home: class extends self.ISpriteInstance {},
	listen1: class extends self.ISpriteInstance {},
	btn_play: class extends self.ISpriteInstance {},
	btn_pause: class extends self.ISpriteInstance {},
	sing1: class extends self.ISpriteInstance {},
	Videolisten: class extends self.IWorldInstance {},
	Videokaraoke: class extends self.IWorldInstance {},
	butons: class extends self.ISpriteInstance {}
}