let pointerClientX = 0;
let pointerClientY = 0;
let hasPointerPosition = false;
let startButtonPressed = false;
let infoButtonPressed = false;
let referencesButtonPressed = false;
let screenShrinkButtonPressed = false;
let screenMaximizeButtonPressed = false;
let soundCloseButtonPressed = false;
let soundOpenButtonPressed = false;
let closeButtonPressed = false;
let pressedButtonName = "";
let secListenButtonPressed = false;
let secHomeButtonPressed = false;
let screenFullscreenActionHandledOnPointerDown = false;
let startButtonMotionTime = 0;
let startButtonBaseWidth = null;
let startButtonBaseHeight = null;
let startButtonBaseAngle = null;
let songtimeMotionTime = 0;
let songtimeBaseAngle = null;
let songtimeBaseY = null;
let wedoMotionTime = 0;
let wedoBaseX = null;
let wedoBaseY = null;
let wedoBaseAngle = null;
let secButtonsMotionTime = 0;
let secListenBaseX = null;
let secKaraokeBaseX = null;
let songtimeAudio = null;
let songtimeTimer = null;
let songtimeAudioReady = null;
let chooseAudio = null;
let chooseTimer = null;
let chooseAudioReady = null;
let listenAudio = null;
let listenAudioReady = null;
let karaokeAudio = null;
let karaokeAudioReady = null;
let bestAudio = null;
let bestAudioReady = null;
let bestTimer = null;
let backgroundAudio = null;
let backgroundAudioReady = null;
let listenVideoReady = null;
let listenVideoElement = null;
let listenPlayButtonTimer = null;
let karaokeVideoReady = null;
let karaokeVideoElement = null;
let karaokePauseButtonTimer = null;
let canvasFullscreenFallback = false;
let canvasFullscreenStyle = null;
let canvasFullscreenBodyOverflow = "";
let canvasFullscreenHtmlOverflow = "";
let mobileScreenControlsState = null;
let mobileIOSFullscreenFallback = false;

const coverButtonNames = [
	"btn_start",
	"btn_references",
	"btn_ekrankucult",
	"btn_seskapat",
	"btn_ekrankapla",
	"btn_secac",
	"btn_info"
];

runOnStartup(async runtime =>
{
	runtime.addEventListener("beforeprojectstart", () =>
	{
		ApplyResponsiveCanvasStyles();
		UpdateScreenControlsForDevice(runtime);

		// Pointer events are the common input path for mouse, touch and pen.
		// Disable browser gestures on the game surface so a swipe/drag cannot
		// cancel a button tap or scroll the page on phones and tablets.
		if (typeof document !== "undefined")
		{
			const canvas = document.querySelector("canvas");
			if (canvas)
			{
				canvas.style.touchAction = "none";
				canvas.style.userSelect = "none";
				canvas.style.webkitUserSelect = "none";
			}
		}

		const onPointerMove = event =>
		{
			if (!Number.isFinite(event.clientX) || !Number.isFinite(event.clientY))
				return;

			pointerClientX = event.clientX;
			pointerClientY = event.clientY;
			hasPointerPosition = true;

			UpdateCoverButtons(runtime);
		};

		runtime.addEventListener("mousemove", onPointerMove);
		runtime.addEventListener("pointermove", onPointerMove);
		runtime.addEventListener("tick", () =>
		{
			const layoutName = runtime.layout.name.toLowerCase();
			if (layoutName === "sec")
			{
				const listenButton = runtime.objects.btn_listen?.getFirstInstance();
				const karaokeButton = runtime.objects.btn_karaoke?.getFirstInstance();
				if (listenButton && secListenBaseX === null)
					secListenBaseX = listenButton.x;
				if (karaokeButton && secKaraokeBaseX === null)
					secKaraokeBaseX = karaokeButton.x;

				secButtonsMotionTime += runtime.dt;
				if (listenButton)
					listenButton.setPosition(secListenBaseX + Math.sin(secButtonsMotionTime * 0.9) * 8, listenButton.y);
				if (karaokeButton)
					karaokeButton.setPosition(secKaraokeBaseX - Math.sin(secButtonsMotionTime * 0.9) * 8, karaokeButton.y);
				return;
			}

			if (layoutName !== "kapak")
				return;

			const songtime = runtime.objects.songtime?.getFirstInstance();
			if (songtime)
			{
				if (songtimeBaseAngle === null)
					songtimeBaseAngle = songtime.angle;
				if (songtimeBaseY === null)
					songtimeBaseY = songtime.y;

				songtimeMotionTime += runtime.dt;
				songtime.setPosition(songtime.x, songtimeBaseY + Math.sin(songtimeMotionTime * 0.9) * 8);
				songtime.angle = songtimeBaseAngle;
			}

			const wedo = runtime.objects.wedo?.getFirstInstance();
			if (wedo)
			{
				if (wedoBaseX === null)
				{
					wedoBaseX = wedo.x;
					wedoBaseY = wedo.y;
					wedoBaseAngle = wedo.angle;
				}

				wedoMotionTime += runtime.dt;
				wedo.setPosition(
					wedoBaseX + Math.sin(wedoMotionTime * 0.55) * 3,
					wedoBaseY
				);
				wedo.angle = wedoBaseAngle + Math.sin(wedoMotionTime * 0.6) * 0.012;
			}

			const startButton = runtime.objects.btn_start?.getFirstInstance();
			if (!startButton)
				return;

			if (startButtonBaseWidth === null)
			{
				startButtonBaseWidth = startButton.width;
				startButtonBaseHeight = startButton.height;
				startButtonBaseAngle = startButton.angle;
			}

			startButtonMotionTime += runtime.dt;
			const scale = 1 + Math.sin(startButtonMotionTime * 1.8) * 0.035;
			startButton.setSize(startButtonBaseWidth * scale, startButtonBaseHeight * scale);
			startButton.angle = startButtonBaseAngle;
		});
		if (typeof window !== "undefined")
		{
			const onViewportChange = () =>
			{
				RefreshVideoBoundsSoon();
				UpdateScreenControlsForDevice(runtime);
			};
			window.addEventListener("resize", onViewportChange);
			window.addEventListener("orientationchange", onViewportChange);
			window.visualViewport?.addEventListener("resize", RefreshVideoBoundsSoon);
			window.visualViewport?.addEventListener("scroll", RefreshVideoBoundsSoon);
		}
		if (typeof document !== "undefined")
			document.addEventListener("fullscreenchange", () =>
		{
			RefreshVideoBoundsSoon();
			UpdateScreenControlsForDevice(runtime);
		});
		songtimeAudioReady = PrepareSongtimeAudio(runtime);
		bestAudioReady = PrepareNamedAudio(runtime, "best.webm", "best");
		backgroundAudioReady = PrepareNamedAudio(runtime, "fon.webm", "background");
		listenAudioReady = PrepareNamedAudio(runtime, "listen.webm", "listen");
		chooseAudioReady = PrepareChooseAudio(runtime);
		karaokeAudioReady = PrepareNamedAudio(runtime, "singsong.webm", "singsong");
		listenVideoReady = PrepareListenVideo(runtime);
		karaokeVideoReady = PrepareKaraokeVideo(runtime);

	// Kapak layoutu her açıldığında songtime sesini 2 saniye sonra başlat.
	// Diğer layoutlarda bekleyen zamanlayıcıyı ve sesi durdur.
	runtime.addEventListener("afteranylayoutstart", () =>
		{
			UpdateScreenControlsForDevice(runtime);
			const layoutName = runtime.layout.name.toLowerCase();
			if (layoutName === "listen")
				StopConstructListenVideos(runtime);
			if (layoutName === "karaoke")
				StopConstructKaraokeVideos(runtime);

			startButtonMotionTime = 0;
			startButtonBaseWidth = null;
			startButtonBaseHeight = null;
			startButtonBaseAngle = null;
			songtimeMotionTime = 0;
			songtimeBaseAngle = null;
			songtimeBaseY = null;
			wedoMotionTime = 0;
			wedoBaseX = null;
			wedoBaseY = null;
			wedoBaseAngle = null;
			secButtonsMotionTime = 0;
			secListenBaseX = null;
			secKaraokeBaseX = null;

			if (listenPlayButtonTimer !== null)
			{
				clearTimeout(listenPlayButtonTimer);
				listenPlayButtonTimer = null;
			}

			if (karaokePauseButtonTimer !== null)
			{
				clearTimeout(karaokePauseButtonTimer);
				karaokePauseButtonTimer = null;
			}

			const listenPlayButton = runtime.objects.btn_play?.getFirstInstance();
			const listenPauseButton = runtime.objects.btn_pause?.getFirstInstance();
			if (listenPlayButton)
				listenPlayButton.isVisible = true;
			if (listenPauseButton)
				listenPauseButton.isVisible = layoutName !== "listen";

			if (layoutName === "listen" && listenPauseButton)
			{
				listenPlayButtonTimer = setTimeout(() =>
				{
					listenPlayButtonTimer = null;
					if (runtime.layout.name.toLowerCase() === "listen")
						listenPauseButton.isVisible = true;
				}, 4000);
			}

			if (layoutName === "karaoke" && listenPauseButton)
			{
				listenPauseButton.isVisible = false;
				karaokePauseButtonTimer = setTimeout(() =>
				{
					karaokePauseButtonTimer = null;
					if (runtime.layout.name.toLowerCase() === "karaoke")
						listenPauseButton.isVisible = true;
				}, 4000);
			}

			StopListenVideo();

			StopKaraokeVideo();

			if (songtimeTimer !== null)
			{
				clearTimeout(songtimeTimer);
				songtimeTimer = null;
			}

			if (bestTimer !== null)
			{
				clearTimeout(bestTimer);
				bestTimer = null;
			}

			if (layoutName !== "kapak")
			{
				StopSongtimeAudio();
				StopAudioElement(bestAudio);
			}
			else
			{
				songtimeTimer = setTimeout(() =>
				{
					songtimeTimer = null;
					PlaySongtimeAudio(runtime);
				}, 1000);
			}

			if (chooseTimer !== null)
			{
				clearTimeout(chooseTimer);
				chooseTimer = null;
			}

			if (layoutName === "sec")
			{
				chooseTimer = setTimeout(() =>
				{
					chooseTimer = null;
					PlayChooseAudio();
				}, 1000);
			}
			else
			{
				StopChooseAudio();
			}

			if (layoutName === "listen")
			{
				PlayListenAudio(runtime);
			}
			else
			{
				StopAudioElement(listenAudio);
			}

			if (layoutName === "karaoke")
			{
				PlayKaraokeAudio(runtime);
			}
			else
			{
				StopAudioElement(karaokeAudio);
			}

			if (IsBackgroundAudioLayout(layoutName))
			{
				PlayBackgroundAudio(runtime);
			}
			else
			{
				StopAudioElement(backgroundAudio);
			}
		});

		// sec layoutu preview başlangıç layoutu olduğunda btn_home için
		// masaüstü mouse tıklamasını doğrudan yakala.
		runtime.addEventListener("mousedown", event =>
		{
			// Modern browsers also emit pointer events for mouse input. The
			// pointer handlers below are the single source of truth; retain this
			// branch only as a legacy fallback where PointerEvent is unavailable.
			if (typeof window !== "undefined" && "PointerEvent" in window)
				return;

			const layoutName = runtime.layout.name.toLowerCase();
			if (layoutName === "listen")
			{
				const homeButton = runtime.objects.btn_home?.getFirstInstance();
				if (homeButton && IsPointerOverButton(homeButton, event.clientX, event.clientY))
					runtime.goToLayout("kapak");

				const categoryButton = runtime.objects.btn_kategori?.getFirstInstance();
				if (categoryButton && IsPointerOverButton(categoryButton, event.clientX, event.clientY))
					runtime.goToLayout("sec");

				const screenShrinkButton = runtime.objects.btn_ekrankucult?.getFirstInstance();
				if (screenShrinkButton && IsPointerOverButton(screenShrinkButton, event.clientX, event.clientY))
				{
					HandleScreenFullscreenButton(runtime, "btn_ekrankucult");
					UpdateListenVideoBounds();
					return;
				}

				const screenMaximizeButton = runtime.objects.btn_ekrankapla?.getFirstInstance();
				if (screenMaximizeButton && IsPointerOverButton(screenMaximizeButton, event.clientX, event.clientY))
				{
					HandleScreenFullscreenButton(runtime, "btn_ekrankapla");
					UpdateListenVideoBounds();
					return;
				}

				const playButton = runtime.objects.btn_play?.getFirstInstance();
				if (playButton && IsPointerOverButton(playButton, event.clientX, event.clientY))
				{
					ResumeListenVideo();
					MovePlayPauseButtonsToPlay(runtime);
					return;
				}

				const pauseButton = runtime.objects.btn_pause?.getFirstInstance();
				if (pauseButton && IsPointerOverButton(pauseButton, event.clientX, event.clientY))
				{
					PauseListenVideo();
					MovePlayPauseButtonsToPause(runtime);
				}

				return;
			}

			if (layoutName === "karaoke")
			{
				const homeButton = runtime.objects.btn_home?.getFirstInstance();
				if (homeButton && IsPointerOverButton(homeButton, event.clientX, event.clientY))
					runtime.goToLayout("kapak");

				const categoryButton = runtime.objects.btn_kategori?.getFirstInstance();
				if (categoryButton && IsPointerOverButton(categoryButton, event.clientX, event.clientY))
					runtime.goToLayout("sec");

				const screenShrinkButton = runtime.objects.btn_ekrankucult?.getFirstInstance();
				if (screenShrinkButton && IsPointerOverButton(screenShrinkButton, event.clientX, event.clientY))
				{
					HandleScreenFullscreenButton(runtime, "btn_ekrankucult");
					UpdateKaraokeVideoBounds();
					return;
				}

				const screenMaximizeButton = runtime.objects.btn_ekrankapla?.getFirstInstance();
				if (screenMaximizeButton && IsPointerOverButton(screenMaximizeButton, event.clientX, event.clientY))
				{
					HandleScreenFullscreenButton(runtime, "btn_ekrankapla");
					UpdateKaraokeVideoBounds();
				}

				const playButton = runtime.objects.btn_play?.getFirstInstance();
				if (playButton && IsPointerOverButton(playButton, event.clientX, event.clientY))
				{
					ResumeKaraokeVideo();
					MovePlayPauseButtonsToPlay(runtime);
					return;
				}

				const pauseButton = runtime.objects.btn_pause?.getFirstInstance();
				if (pauseButton && IsPointerOverButton(pauseButton, event.clientX, event.clientY))
				{
					PauseKaraokeVideo();
					MovePlayPauseButtonsToPause(runtime);
				}

				return;
			}

			if (layoutName !== "sec")
				return;

			const homeButton = runtime.objects.btn_home?.getFirstInstance();
			if (homeButton && IsPointerOverButton(homeButton, event.clientX, event.clientY))
			{
				runtime.goToLayout("kapak");
				return;
			}

			const listenButton = runtime.objects.btn_listen?.getFirstInstance();
			if (listenButton && IsPointerOverButton(listenButton, event.clientX, event.clientY))
			{
				runtime.goToLayout("listen");
				return;
			}

			const karaokeButton = runtime.objects.btn_karaoke?.getFirstInstance();
			if (karaokeButton && IsPointerOverButton(karaokeButton, event.clientX, event.clientY))
			{
				runtime.goToLayout("karaoke");
				return;
			}

			const soundCloseButton = runtime.objects.btn_seskapat?.getFirstInstance();
			if (soundCloseButton && IsPointerOverButton(soundCloseButton, event.clientX, event.clientY))
			{
				PauseBackgroundMusic();
				MoveSecSoundButtonsToClosed(runtime);
				return;
			}

			const soundOpenButton = runtime.objects.btn_secac?.getFirstInstance();
			if (soundOpenButton && IsPointerOverButton(soundOpenButton, event.clientX, event.clientY))
			{
				ResumeBackgroundMusic(runtime);
				MoveSecSoundButtonsToOpen(runtime);
				return;
			}

			const screenShrinkButton = runtime.objects.btn_ekrankucult?.getFirstInstance();
			if (screenShrinkButton && IsPointerOverButton(screenShrinkButton, event.clientX, event.clientY))
			{
				MoveSecScreenButtonsToShrink(runtime);
				return;
			}

			const screenMaximizeButton = runtime.objects.btn_ekrankapla?.getFirstInstance();
			if (screenMaximizeButton && IsPointerOverButton(screenMaximizeButton, event.clientX, event.clientY))
				MoveSecScreenButtonsToMaximize(runtime);
		});

		runtime.addEventListener("pointerdown", event =>
		{
			// Mobile Safari/Chrome require a user gesture before media can be
			// played. Unlock every prepared media element during the gesture so
			// the next layout can start its audio/video normally.
			UnlockMobileMedia();
			StartMobileBackgroundAudio(runtime);

			// Keep receiving pointerup even when a finger moves slightly outside
			// the canvas while tapping a button.
			if (typeof document !== "undefined" && Number.isFinite(event.pointerId))
			{
				const canvas = document.querySelector("canvas");
				try
				{
					canvas?.setPointerCapture(event.pointerId);
				}
				catch (_) {}
			}

			const layoutName = runtime.layout.name.toLowerCase();
			if (layoutName === "gamebutons" || layoutName === "references")
			{
				const closeButton = runtime.objects.btn_kapat?.getFirstInstance();
				closeButtonPressed = !!closeButton && IsPointerOverButton(closeButton, event.clientX, event.clientY);
				return;
			}

			if (layoutName === "sec" || layoutName === "listen" || layoutName === "karaoke")
			{
				if (layoutName === "sec")
				{
					const listenButton = runtime.objects.btn_listen?.getFirstInstance();
					const homeButton = runtime.objects.btn_home?.getFirstInstance();
					secListenButtonPressed = !!listenButton && IsPointerOverButton(listenButton, event.clientX, event.clientY);
					secHomeButtonPressed = !!homeButton && IsPointerOverButton(homeButton, event.clientX, event.clientY);
				}

				pressedButtonName = GetButtonNameUnderPointer(runtime, event.clientX, event.clientY);
				if (pressedButtonName === "btn_ekrankucult" || pressedButtonName === "btn_ekrankapla")
				{
					HandleScreenFullscreenButton(runtime, pressedButtonName);
					screenFullscreenActionHandledOnPointerDown = true;
				}
				return;
			}

			if (layoutName !== "kapak")
				return;

			const startButton = runtime.objects.btn_start?.getFirstInstance();
			const infoButton = runtime.objects.btn_info?.getFirstInstance();
			const referencesButton = runtime.objects.btn_references?.getFirstInstance();
			const screenShrinkButton = runtime.objects.btn_ekrankucult?.getFirstInstance();
			const screenMaximizeButton = runtime.objects.btn_ekrankapla?.getFirstInstance();
			const soundCloseButton = runtime.objects.btn_seskapat?.getFirstInstance();
			const soundOpenButton = runtime.objects.btn_secac?.getFirstInstance();
			startButtonPressed = !!startButton && IsPointerOverButton(startButton, event.clientX, event.clientY);
			infoButtonPressed = !!infoButton && IsPointerOverButton(infoButton, event.clientX, event.clientY);
			referencesButtonPressed = !!referencesButton && IsPointerOverButton(referencesButton, event.clientX, event.clientY);
			screenShrinkButtonPressed = !!screenShrinkButton && IsPointerOverButton(screenShrinkButton, event.clientX, event.clientY);
			screenMaximizeButtonPressed = !!screenMaximizeButton && IsPointerOverButton(screenMaximizeButton, event.clientX, event.clientY);
			soundCloseButtonPressed = !!soundCloseButton && IsPointerOverButton(soundCloseButton, event.clientX, event.clientY);
			soundOpenButtonPressed = !!soundOpenButton && IsPointerOverButton(soundOpenButton, event.clientX, event.clientY);

			if (screenShrinkButtonPressed)
			{
				HandleScreenFullscreenButton(runtime, "btn_ekrankucult");
				screenFullscreenActionHandledOnPointerDown = true;
			}
			else if (screenMaximizeButtonPressed)
			{
				HandleScreenFullscreenButton(runtime, "btn_ekrankapla");
				screenFullscreenActionHandledOnPointerDown = true;
			}
		});

		runtime.addEventListener("pointerup", event =>
		{
			if (!startButtonPressed && !infoButtonPressed && !referencesButtonPressed && !screenShrinkButtonPressed && !screenMaximizeButtonPressed && !soundCloseButtonPressed && !soundOpenButtonPressed && !closeButtonPressed && !pressedButtonName && !secListenButtonPressed && !secHomeButtonPressed)
				return;

			const wasStartButtonPressed = startButtonPressed;
			const wasInfoButtonPressed = infoButtonPressed;
			const wasReferencesButtonPressed = referencesButtonPressed;
			const wasScreenShrinkButtonPressed = screenShrinkButtonPressed;
			const wasScreenMaximizeButtonPressed = screenMaximizeButtonPressed;
			const wasSoundCloseButtonPressed = soundCloseButtonPressed;
			const wasSoundOpenButtonPressed = soundOpenButtonPressed;
			const wasCloseButtonPressed = closeButtonPressed;
			const wasPressedButtonName = pressedButtonName;
			const wasSecListenButtonPressed = secListenButtonPressed;
			const wasSecHomeButtonPressed = secHomeButtonPressed;
			startButtonPressed = false;
			infoButtonPressed = false;
			referencesButtonPressed = false;
			screenShrinkButtonPressed = false;
			screenMaximizeButtonPressed = false;
			soundCloseButtonPressed = false;
			soundOpenButtonPressed = false;
			closeButtonPressed = false;
			pressedButtonName = "";
			secListenButtonPressed = false;
			secHomeButtonPressed = false;
			const wasScreenFullscreenActionHandledOnPointerDown = screenFullscreenActionHandledOnPointerDown;
			screenFullscreenActionHandledOnPointerDown = false;

			if (wasScreenFullscreenActionHandledOnPointerDown)
				return;

			if (wasCloseButtonPressed && (runtime.layout.name.toLowerCase() === "gamebutons" || runtime.layout.name.toLowerCase() === "references"))
			{
				const closeButton = runtime.objects.btn_kapat?.getFirstInstance();
				if (closeButton && IsPointerOverButton(closeButton, event.clientX, event.clientY))
					runtime.goToLayout("kapak");
				return;
			}

			if (wasSecListenButtonPressed && runtime.layout.name.toLowerCase() === "sec")
			{
				const listenButton = runtime.objects.btn_listen?.getFirstInstance();
				if (listenButton && IsPointerOverButton(listenButton, event.clientX, event.clientY))
					runtime.goToLayout("listen");
				return;
			}

			if (wasSecHomeButtonPressed && runtime.layout.name.toLowerCase() === "sec")
			{
				const homeButton = runtime.objects.btn_home?.getFirstInstance();
				if (homeButton && IsPointerOverButton(homeButton, event.clientX, event.clientY))
					runtime.goToLayout("kapak");
				return;
			}

			if (wasPressedButtonName && HandleSecondaryLayoutButton(runtime, wasPressedButtonName, event.clientX, event.clientY))
				return;

			if (runtime.layout.name.toLowerCase() !== "kapak")
				return;

			const startButton = runtime.objects.btn_start?.getFirstInstance();
			const infoButton = runtime.objects.btn_info?.getFirstInstance();
			const referencesButton = runtime.objects.btn_references?.getFirstInstance();
			const screenShrinkButton = runtime.objects.btn_ekrankucult?.getFirstInstance();
			const screenMaximizeButton = runtime.objects.btn_ekrankapla?.getFirstInstance();
			const soundCloseButton = runtime.objects.btn_seskapat?.getFirstInstance();
			const soundOpenButton = runtime.objects.btn_secac?.getFirstInstance();

			if (wasStartButtonPressed && startButton && IsPointerOverButton(startButton, event.clientX, event.clientY))
			{
				StopAllGameAudio();
				runtime.goToLayout("sec");
			}
			else if (wasInfoButtonPressed && infoButton && IsPointerOverButton(infoButton, event.clientX, event.clientY))
				runtime.goToLayout("gamebutons");
			else if (wasReferencesButtonPressed && referencesButton && IsPointerOverButton(referencesButton, event.clientX, event.clientY))
				runtime.goToLayout("references");
			else if (wasScreenShrinkButtonPressed && screenShrinkButton && IsPointerOverButton(screenShrinkButton, event.clientX, event.clientY))
			{
				ExitFullscreenAndUpdateButtons(runtime);
			}
			else if (wasScreenMaximizeButtonPressed && screenMaximizeButton && IsPointerOverButton(screenMaximizeButton, event.clientX, event.clientY))
			{
				EnterFullscreenAndUpdateButtons(runtime);
			}
			else if (wasSoundCloseButtonPressed && soundCloseButton && IsPointerOverButton(soundCloseButton, event.clientX, event.clientY))
			{
				PauseBackgroundMusic();
				MoveSoundButtonsToClosed(runtime);
				UpdateCoverButtons(runtime);
			}
			else if (wasSoundOpenButtonPressed && soundOpenButton && IsPointerOverButton(soundOpenButton, event.clientX, event.clientY))
			{
				ResumeBackgroundMusic(runtime);
				MoveSoundButtonsToOpen(runtime);
				UpdateCoverButtons(runtime);
			}
		});

		runtime.addEventListener("pointercancel", () =>
		{
			startButtonPressed = false;
			infoButtonPressed = false;
			referencesButtonPressed = false;
			screenShrinkButtonPressed = false;
			screenMaximizeButtonPressed = false;
			soundCloseButtonPressed = false;
			soundOpenButtonPressed = false;
			closeButtonPressed = false;
			pressedButtonName = "";
			secListenButtonPressed = false;
			secHomeButtonPressed = false;
			screenFullscreenActionHandledOnPointerDown = false;
		});

		runtime.addEventListener("afteranylayoutstart", () =>
		{
			hasPointerPosition = false;
			startButtonPressed = false;
			infoButtonPressed = false;
			referencesButtonPressed = false;
			screenShrinkButtonPressed = false;
			screenMaximizeButtonPressed = false;
			soundCloseButtonPressed = false;
			soundOpenButtonPressed = false;
			closeButtonPressed = false;
			pressedButtonName = "";
			secListenButtonPressed = false;
			secHomeButtonPressed = false;
			SetCoverButtonsFrame(runtime, 0);
		});

		if (typeof document !== "undefined")
		{
			document.querySelector("canvas")?.addEventListener("pointerleave", () =>
			{
				hasPointerPosition = false;
				startButtonPressed = false;
				infoButtonPressed = false;
				referencesButtonPressed = false;
				screenShrinkButtonPressed = false;
				screenMaximizeButtonPressed = false;
				soundCloseButtonPressed = false;
				soundOpenButtonPressed = false;
				closeButtonPressed = false;
				pressedButtonName = "";
				secListenButtonPressed = false;
				secHomeButtonPressed = false;
				screenFullscreenActionHandledOnPointerDown = false;
				SetCanvasCursor("default");
				SetCoverButtonsFrame(runtime, 0);
			});
		}
	});

		// Layout kapanırken/eski layout sonlanırken tüm sesleri hemen durdur.
		runtime.addEventListener("beforeanylayoutend", StopAllGameAudio);
		runtime.addEventListener("beforeanylayoutstart", StopAllGameAudio);
		runtime.addEventListener("beforeanylayoutstart", () => StopConstructListenVideos(runtime));
		runtime.addEventListener("beforeanylayoutstart", () => StopConstructKaraokeVideos(runtime));
});

function UpdateCoverButtons(runtime)
{
	if (!hasPointerPosition)
		return;

	const buttonFamily = runtime.objects.butons;
	if (!buttonFamily)
		return;

	let isOverCoverButton = false;
	for (const button of buttonFamily.getAllInstances())
	{
		const isOverButton = IsPointerOverButton(button, pointerClientX, pointerClientY);
		if (isOverButton)
			isOverCoverButton = true;

		SetButtonFrame(button, isOverButton ? 1 : 0);
	}

	// Bu üç butonu ayrıca doğrudan kontrol et; family erişimi değişse bile
	// cursor davranışı çalışmaya devam etsin.
	for (const buttonName of ["btn_start", "btn_listen", "btn_karaoke"])
	{
		const button = runtime.objects[buttonName]?.getFirstInstance();
		if (button && IsPointerOverButton(button, pointerClientX, pointerClientY))
			isOverCoverButton = true;
	}

	if (["references", "gamebutons"].includes(runtime.layout.name.toLowerCase()))
	{
		const closeButton = runtime.objects.btn_kapat?.getFirstInstance();
		if (closeButton && IsPointerOverButton(closeButton, pointerClientX, pointerClientY))
			isOverCoverButton = true;
	}

	SetCanvasCursor(isOverCoverButton ? "pointer" : "default");
}

async function PrepareListenVideo(runtime)
{
	if (typeof document === "undefined")
		return;

	try
	{
		// Script yeniden başlatılırsa eski/stale video elementlerini temizle.
		// Bu projede video kullanan iki akış da script tarafından yeniden oluşturulur.
		document.querySelectorAll("video").forEach(video =>
		{
			video.pause();
			video.remove();
		});

		const videoFile = runtime.assets.projectFileList.find(file =>
			file.name.replace(/^media[\\/]/i, "").toLowerCase() === "listen_video.mp4");
		if (!videoFile)
			throw new Error("listen_video.mp4 proje asset listesinde bulunamadı");

		const mediaFileName = videoFile.name.replace(/^media[\\/]/i, "");
		const videoUrl = await runtime.assets.getMediaFileUrl(mediaFileName);
		const video = document.createElement("video");
		video.preload = "auto";
		video.autoplay = false;
		video.controls = false;
		video.loop = false;
		video.playsInline = true;
		video.setAttribute("playsinline", "");
		video.style.position = "fixed";
		video.style.display = "none";
		video.style.objectFit = "fill";
		video.style.pointerEvents = "none";
		video.style.zIndex = "1";
		video.dataset.themeVideo = "listen";
		video.src = videoUrl;
		video.addEventListener("ended", () =>
		{
			if (runtime.layout.name.toLowerCase() === "listen")
				runtime.goToLayout("sec");
		});
		document.body.appendChild(video);
		listenVideoElement = video;
		listenVideoReady = Promise.resolve(video);
	}
	catch (error)
	{
		console.warn("listen videosu yüklenemedi:", error);
		listenVideoReady = Promise.resolve(null);
	}
}

async function PlayListenVideo(runtime)
{
	await listenVideoReady;
	if (!listenVideoElement || runtime.layout.name.toLowerCase() !== "listen")
		return;

	// Eski/stale veya Construct tarafından bırakılmış başka video varsa
	// listen ekranında yalnızca bu video ve sesi aktif kalmalı.
	document.querySelectorAll("video").forEach(video =>
	{
		if (video === listenVideoElement)
			return;

		video.pause();
		video.currentTime = 0;
		video.muted = true;
		video.style.display = "none";
	});

	UpdateListenVideoBounds();
	listenVideoElement.currentTime = 0;
	listenVideoElement.muted = false;
	listenVideoElement.volume = 1;
	listenVideoElement.style.display = "block";
	listenVideoElement.play().catch(error =>
	{
		console.warn("listen videosu başlatılamadı:", error);
	});
}

function StopListenVideo()
{
	if (!listenVideoElement)
		return;

	listenVideoElement.pause();
	listenVideoElement.currentTime = 0;
	listenVideoElement.style.display = "none";
}

function StopConstructListenVideos(runtime)
{
	const videoObject = runtime.objects.Videolisten;
	const videoInstances = videoObject?.getAllInstances?.() ?? [];

	for (const videoInstance of videoInstances)
	{
		videoInstance.stop?.();
		videoInstance.pause?.();
		videoInstance.isVisible = false;
	}
}

function StopConstructKaraokeVideos(runtime)
{
	const videoObject = runtime.objects.Videokaraoke;
	const videoInstances = videoObject?.getAllInstances?.() ?? [];

	for (const videoInstance of videoInstances)
	{
		videoInstance.stop?.();
		videoInstance.pause?.();
		videoInstance.isVisible = false;
	}
}

function PauseListenVideo()
{
	if (listenVideoElement)
		listenVideoElement.pause();
}

function ResumeListenVideo()
{
	if (!listenVideoElement)
		return;

	listenVideoElement.play().catch(error =>
	{
		console.warn("listen videosu devam ettirilemedi:", error);
	});
}

async function PrepareKaraokeVideo(runtime)
{
	if (typeof document === "undefined")
		return;

	try
	{
		const videoFile = runtime.assets.projectFileList.find(file =>
		file.name.replace(/^media[\\/]/i, "").toLowerCase() === "karaoke_video.mp4");
		if (!videoFile)
			throw new Error("karaoke_video.mp4 proje asset listesinde bulunamadı");

		const mediaFileName = videoFile.name.replace(/^media[\\/]/i, "");
		const videoUrl = await runtime.assets.getMediaFileUrl(mediaFileName);
		const video = document.createElement("video");
		video.preload = "auto";
		video.autoplay = false;
		video.controls = false;
		video.loop = false;
		video.playsInline = true;
		video.setAttribute("playsinline", "");
		video.style.position = "fixed";
		video.style.display = "none";
		video.style.objectFit = "fill";
		video.style.pointerEvents = "none";
		video.style.zIndex = "1";
		video.src = videoUrl;
		video.addEventListener("ended", () =>
		{
			if (runtime.layout.name.toLowerCase() === "karaoke")
				runtime.goToLayout("sec");
		});
		document.body.appendChild(video);
		karaokeVideoElement = video;
		karaokeVideoReady = Promise.resolve(video);
	}
	catch (error)
	{
		console.warn("karaoke videosu yüklenemedi:", error);
		karaokeVideoReady = Promise.resolve(null);
	}
}

async function PlayKaraokeVideo(runtime)
{
	await karaokeVideoReady;
	if (!karaokeVideoElement || runtime.layout.name.toLowerCase() !== "karaoke")
		return;

	UpdateKaraokeVideoBounds();
	karaokeVideoElement.currentTime = 0;
	karaokeVideoElement.muted = false;
	karaokeVideoElement.volume = 1;
	karaokeVideoElement.style.display = "block";
	karaokeVideoElement.play().catch(error =>
	{
		console.warn("karaoke videosu başlatılamadı:", error);
	});
}

function StopKaraokeVideo()
{
	if (!karaokeVideoElement)
		return;

	karaokeVideoElement.pause();
	karaokeVideoElement.currentTime = 0;
	karaokeVideoElement.style.display = "none";
}

function PauseKaraokeVideo()
{
	if (karaokeVideoElement)
		karaokeVideoElement.pause();
}

function ResumeKaraokeVideo()
{
	if (!karaokeVideoElement)
		return;

	karaokeVideoElement.play().catch(error =>
	{
		console.warn("karaoke videosu devam ettirilemedi:", error);
	});
}

function UpdateKaraokeVideoBounds()
{
	if (!karaokeVideoElement || typeof document === "undefined")
		return;

	const canvas = document.querySelector("canvas");
	if (!canvas)
		return;

	const rect = canvas.getBoundingClientRect();
	const scale = Math.min(rect.width / 1920, rect.height / 1080);
	const offsetX = rect.left + (rect.width - 1920 * scale) / 2;
	const offsetY = rect.top + (rect.height - 1080 * scale) / 2;
	karaokeVideoElement.style.left = `${offsetX + 71 * scale}px`;
	karaokeVideoElement.style.top = `${offsetY + 148 * scale}px`;
	karaokeVideoElement.style.width = `${1777 * scale}px`;
	karaokeVideoElement.style.height = `${899 * scale}px`;
}

function UpdateListenVideoBounds()
{
	if (!listenVideoElement || typeof document === "undefined")
		return;

	const canvas = document.querySelector("canvas");
	if (!canvas)
		return;

	const rect = canvas.getBoundingClientRect();
	const scale = Math.min(rect.width / 1920, rect.height / 1080);
	const offsetX = rect.left + (rect.width - 1920 * scale) / 2;
	const offsetY = rect.top + (rect.height - 1080 * scale) / 2;
	listenVideoElement.style.left = `${offsetX + 71 * scale}px`;
	listenVideoElement.style.top = `${offsetY + 148 * scale}px`;
	listenVideoElement.style.width = `${1777 * scale}px`;
	listenVideoElement.style.height = `${899 * scale}px`;
}

function RefreshVideoBoundsSoon()
{
	UpdateCanvasFullscreenFallback();
	UpdateListenVideoBounds();
	UpdateKaraokeVideoBounds();

	if (typeof requestAnimationFrame === "function")
		requestAnimationFrame(() =>
		{
			UpdateCanvasFullscreenFallback();
			UpdateListenVideoBounds();
			UpdateKaraokeVideoBounds();
		});

	setTimeout(() =>
	{
		UpdateCanvasFullscreenFallback();
		UpdateListenVideoBounds();
		UpdateKaraokeVideoBounds();
	}, 120);
}

function SetCanvasCursor(cursor)
{
	if (typeof document === "undefined")
		return;

	// Preview/export sırasında birden fazla canvas bulunabilir. İmleci
	// canvas, body ve html üzerinde birlikte ayarla.
	document.documentElement.style.setProperty("cursor", cursor, "important");
	document.body?.style.setProperty("cursor", cursor, "important");

	for (const canvas of document.querySelectorAll("canvas"))
		canvas.style.setProperty("cursor", cursor, "important");
}

async function PlaySongtimeAudio(runtime)
{
	if (typeof globalThis.Audio !== "function")
		return;

	try
	{
		await songtimeAudioReady;
		if (!songtimeAudio)
			return;

		songtimeAudio.currentTime = 0;
		songtimeAudio.muted = false;
		await songtimeAudio.play();
	}
	catch (error)
	{
		// Tarayıcı autoplay kısıtlaması varsa oyun akışını durdurma.
		console.warn("songtime sesi başlatılamadı:", error);
	}
}

async function PrepareSongtimeAudio(runtime)
{
	if (typeof globalThis.Audio !== "function")
		return;

	try
	{
		const audioFile = runtime.assets.projectFileList.find(file =>
			file.name.toLowerCase().endsWith("songtime.webm"));
		if (!audioFile)
			throw new Error("songtime.webm proje asset listesinde bulunamadı");

		const mediaFileName = audioFile.name.replace(/^media[\\/]/i, "");
		const audioUrl = await runtime.assets.getMediaFileUrl(mediaFileName);
		songtimeAudio = new globalThis.Audio(audioUrl);
		songtimeAudio.preload = "auto";
		songtimeAudio.autoplay = false;
		songtimeAudio.addEventListener("ended", () =>
		{
			if (runtime.layout.name.toLowerCase() !== "kapak")
				return;

			if (bestTimer !== null)
				clearTimeout(bestTimer);

			bestTimer = setTimeout(() =>
			{
				bestTimer = null;
				PlayBestAudio(runtime);
			}, 1000);
		});
		songtimeAudio.load();
	}
	catch (error)
	{
		console.warn("songtime dosyası yüklenemedi:", error);
	}
}

async function PrepareChooseAudio(runtime)
{
	if (typeof globalThis.Audio !== "function")
		return;

	try
	{
		const audioFile = runtime.assets.projectFileList.find(file =>
			file.name.toLowerCase().endsWith("choose.webm"));
		if (!audioFile)
			throw new Error("choose.webm proje asset listesinde bulunamadı");

		const mediaFileName = audioFile.name.replace(/^media[\\/]/i, "");
		const audioUrl = await runtime.assets.getMediaFileUrl(mediaFileName);
		chooseAudio = new globalThis.Audio(audioUrl);
		chooseAudio.preload = "auto";
		chooseAudio.autoplay = false;
		chooseAudio.load();
	}
	catch (error)
	{
		console.warn("choose dosyası yüklenemedi:", error);
	}
}

async function PlayChooseAudio()
{
	await chooseAudioReady;
	if (!chooseAudio)
		return;

	chooseAudio.currentTime = 0;
	chooseAudio.muted = false;
	const playPromise = chooseAudio.play();
	playPromise?.catch(error =>
	{
		console.warn("choose sesi başlatılamadı:", error);
	});
}

function StopChooseAudio()
{
	if (!chooseAudio)
		return;

	chooseAudio.pause();
	chooseAudio.currentTime = 0;
}

function UnlockChooseAudio()
{
	if (!chooseAudio)
		return;

	chooseAudio.muted = true;
	const unlockPromise = chooseAudio.play();
	unlockPromise?.then(() =>
	{
		chooseAudio.pause();
		chooseAudio.currentTime = 0;
	}).catch(() =>
	{
		// Sonraki kullanıcı etkileşiminde tekrar denenecek.
	});
}

async function PrepareNamedAudio(runtime, fileName, label)
{
	if (typeof globalThis.Audio !== "function")
		return;

	try
	{
		const audioFile = runtime.assets.projectFileList.find(file =>
			file.name.toLowerCase().endsWith(fileName.toLowerCase()));
		if (!audioFile)
			throw new Error(`${fileName} proje asset listesinde bulunamadı`);

		const mediaFileName = audioFile.name.replace(/^media[\\/]/i, "");
		const audioUrl = await runtime.assets.getMediaFileUrl(mediaFileName);
		const audio = new globalThis.Audio(audioUrl);
		audio.preload = "auto";
		audio.autoplay = false;
		audio.load();

		if (label === "listen")
		{
			listenAudio = audio;
			audio.addEventListener("ended", () =>
			{
				if (runtime.layout.name.toLowerCase() === "listen")
					PlayListenVideo(runtime);
			});
		}
		else if (label === "singsong")
		{
			karaokeAudio = audio;
			audio.addEventListener("ended", () =>
			{
				if (runtime.layout.name.toLowerCase() === "karaoke")
					PlayKaraokeVideo(runtime);
			});
		}
		else if (label === "best")
			bestAudio = audio;
		else if (label === "background")
		{
			backgroundAudio = audio;
			backgroundAudio.loop = true;
		}
	}
	catch (error)
	{
		console.warn(`${label} sesi yüklenemedi:`, error);
	}
}

async function PlayAudioElement(audioReady, getAudio, label)
{
	await audioReady;
	const audio = getAudio();
	if (!audio)
		return;

	audio.currentTime = 0;
	audio.muted = false;
	const playPromise = audio.play();
	playPromise?.catch(error =>
	{
		console.warn(`${label} sesi başlatılamadı:`, error);
	});
}

async function PlayListenAudio(runtime)
{
	if (runtime.layout.name.toLowerCase() !== "listen")
		return;

	await listenAudioReady;
	if (runtime.layout.name.toLowerCase() !== "listen" || !listenAudio)
		return;

	listenAudio.currentTime = 0;
	listenAudio.muted = false;
	listenAudio.play().catch(error =>
	{
		console.warn("listen.webm başlatılamadı:", error);
	});
}

async function PlayKaraokeAudio(runtime)
{
	if (runtime.layout.name.toLowerCase() !== "karaoke")
		return;

	await karaokeAudioReady;
	if (runtime.layout.name.toLowerCase() !== "karaoke" || !karaokeAudio)
		return;

	karaokeAudio.currentTime = 0;
	karaokeAudio.muted = false;
	karaokeAudio.play().catch(error =>
	{
		console.warn("singsong.webm başlatılamadı:", error);
	});
}

async function PlayBackgroundAudio(runtime)
{
	if (!IsBackgroundAudioLayout(runtime.layout.name))
		return;

	await backgroundAudioReady;
	if (!IsBackgroundAudioLayout(runtime.layout.name) || !backgroundAudio)
		return;

	backgroundAudio.currentTime = 0;
	backgroundAudio.muted = false;
	backgroundAudio.play().catch(error =>
	{
		console.warn("fon.webm fon müziği başlatılamadı:", error);
	});
}

function IsBackgroundAudioLayout(layoutName)
{
	return ["kapak", "sec", "references", "gamebutons"].includes(layoutName.toLowerCase());
}

async function PlayBestAudio(runtime)
{
	await bestAudioReady;
	if (runtime.layout.name.toLowerCase() !== "kapak" || !bestAudio)
		return;

	bestAudio.currentTime = 0;
	bestAudio.muted = false;
	const playPromise = bestAudio.play();
	playPromise?.catch(error =>
	{
		console.warn("best sesi başlatılamadı:", error);
	});
}

function StopAudioElement(audio)
{
	if (!audio)
		return;

	audio.pause();
	audio.currentTime = 0;
}

function IsMobileDevice()
{
	if (typeof window === "undefined" || typeof window.matchMedia !== "function")
		return false;

	// Use capability/layout media queries instead of window coordinates. This
	// also handles mobile browsers when their address bar changes the viewport.
	return window.matchMedia("(pointer: coarse) and (max-width: 900px)").matches
		|| window.matchMedia("(hover: none) and (max-width: 900px)").matches;
}

function IsIOSDevice()
{
	if (typeof navigator === "undefined")
		return false;

	return /iPhone|iPad|iPod/i.test(navigator.userAgent)
		|| (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

function ApplyResponsiveCanvasStyles()
{
	if (typeof document === "undefined")
		return;

	if (!document.getElementById("responsive-game-canvas-style"))
	{
		const style = document.createElement("style");
		style.id = "responsive-game-canvas-style";
		style.textContent = `
			html, body {
				width: 100%;
				height: 100%;
				margin: 0;
				overflow: hidden;
				overscroll-behavior: none;
			}
		`;
		document.head.appendChild(style);
	}
}

function UnlockMobileMedia()
{
	if (!IsMobileDevice())
		return;

	const mediaElements = [
		songtimeAudio,
		chooseAudio,
		listenAudio,
		karaokeAudio,
		bestAudio
	];

	for (const media of mediaElements)
	{
		if (!media || typeof media.play !== "function")
			continue;

		const wasMuted = media.muted;
		media.muted = true;
		const playPromise = media.play();
		playPromise?.then(() =>
		{
			media.pause();
			media.currentTime = 0;
			media.muted = wasMuted;
		}).catch(() =>
		{
			media.muted = wasMuted;
		});
	}
}

function StartMobileBackgroundAudio(runtime)
{
	if (!IsMobileDevice() || !IsBackgroundAudioLayout(runtime.layout.name) || !backgroundAudio)
		return;

	backgroundAudio.loop = true;
	backgroundAudio.muted = false;
	backgroundAudio.play().catch(error =>
	{
		console.warn("Mobil fon müziği başlatılamadı:", error);
	});
}

function UpdateScreenControlsForDevice(runtime)
{
	// Ekran kontrolleri telefonda da görünür kalmalı. Mobil tarayıcılar
	// fullscreen API'sini desteklemese bile bu butonlar canvas yerleşimini
	// ve uygulamanın kendi ekran modunu kontrol eder.
	mobileScreenControlsState = IsMobileDevice();
	for (const buttonName of ["btn_ekrankucult", "btn_ekrankapla"])
	{
		const button = runtime.objects[buttonName]?.getFirstInstance();
		if (button)
			button.isVisible = true;
	}

}

async function EnterFullscreen()
{
	if (typeof document === "undefined" || document.fullscreenElement || document.webkitFullscreenElement || document.webkitCurrentFullScreenElement)
		return true;

	try
	{
		const canvas = document.querySelector("canvas");
		const targets = IsIOSDevice()
			? [canvas, document.documentElement, document.body].filter(Boolean)
			: [document.documentElement];
		let enteredFullscreen = false;
		let lastError = null;

		for (const target of targets)
		{
			const fullscreenRequest = target.requestFullscreen
				?? target.webkitRequestFullscreen
				?? target.webkitRequestFullScreen;
			if (typeof fullscreenRequest !== "function")
				continue;

			try
			{
				if (fullscreenRequest === target.webkitRequestFullscreen
					|| fullscreenRequest === target.webkitRequestFullScreen)
					await fullscreenRequest.call(target);
				else
					await fullscreenRequest.call(target, { navigationUI: "hide" });

				if (document.fullscreenElement || document.webkitFullscreenElement || document.webkitCurrentFullScreenElement)
				{
					enteredFullscreen = true;
					break;
				}
			}
			catch (error)
			{
				lastError = error;
			}
		}

		if (!enteredFullscreen && lastError)
			throw lastError;
		if (!enteredFullscreen)
			return ApplyCanvasFullscreenFallback();
	}
	catch (error)
	{
		console.warn("Tam ekran açılamadı:", error);
		if (IsIOSDevice())
		{
			mobileIOSFullscreenFallback = true;
			return ApplyCanvasFullscreenFallback();
		}
		return false;
	}

	RefreshVideoBoundsSoon();
	return true;
}

async function ExitFullscreen()
{
	if (mobileIOSFullscreenFallback)
	{
		mobileIOSFullscreenFallback = false;
		RestoreCanvasFullscreenFallback();
		RefreshVideoBoundsSoon();
		return true;
	}

	if (canvasFullscreenFallback)
	{
		RestoreCanvasFullscreenFallback();
		RefreshVideoBoundsSoon();
		return true;
	}

	if (typeof document === "undefined" || (!document.fullscreenElement && !document.webkitFullscreenElement && !document.webkitCurrentFullScreenElement))
		return false;

	try
	{
		const exitFullscreen = document.exitFullscreen
			?? document.webkitExitFullscreen
			?? document.webkitCancelFullScreen;
		if (typeof exitFullscreen !== "function")
			return false;
		await exitFullscreen.call(document);
	}
	catch (error)
	{
		console.warn("Tam ekrandan çıkılamadı:", error);
		return false;
	}

	RefreshVideoBoundsSoon();
	return true;
}

function ApplyCanvasFullscreenFallback()
{
	if (typeof document === "undefined")
		return false;

	const canvas = document.querySelector("canvas");
	if (!canvas)
		return false;

	if (!canvasFullscreenStyle)
	{
		canvasFullscreenStyle = {
			position: canvas.style.position,
			inset: canvas.style.inset,
			width: canvas.style.width,
			height: canvas.style.height,
			maxWidth: canvas.style.maxWidth,
			maxHeight: canvas.style.maxHeight,
			zIndex: canvas.style.zIndex
		};
		canvasFullscreenBodyOverflow = document.body?.style.overflow ?? "";
		canvasFullscreenHtmlOverflow = document.documentElement.style.overflow ?? "";
	}

	// iOS Safari and embedded mobile browsers may reject the Fullscreen API.
	// Keep the game surface usable by providing an app-level fullscreen mode.
	canvas.style.position = "fixed";
	canvas.style.inset = "0";
	canvas.style.width = "100vw";
	canvas.style.height = "100dvh";
	canvas.style.maxWidth = "none";
	canvas.style.maxHeight = "none";
	canvas.style.zIndex = "0";
	document.documentElement.style.overflow = "hidden";
	if (document.body)
		document.body.style.overflow = "hidden";

	canvasFullscreenFallback = true;
	RefreshVideoBoundsSoon();
	return true;
}

function UpdateCanvasFullscreenFallback()
{
	if (!canvasFullscreenFallback || typeof document === "undefined")
		return;

	const canvas = document.querySelector("canvas");
	if (!canvas)
		return;

	canvas.style.position = "fixed";
	canvas.style.inset = "0";
	canvas.style.width = "100vw";
	canvas.style.height = "100dvh";
	canvas.style.maxWidth = "none";
	canvas.style.maxHeight = "none";
}

function RestoreCanvasFullscreenFallback()
{
	if (typeof document !== "undefined")
	{
		const canvas = document.querySelector("canvas");
		if (canvas && canvasFullscreenStyle)
		{
			canvas.style.position = canvasFullscreenStyle.position;
			canvas.style.inset = canvasFullscreenStyle.inset;
			canvas.style.width = canvasFullscreenStyle.width;
			canvas.style.height = canvasFullscreenStyle.height;
			canvas.style.maxWidth = canvasFullscreenStyle.maxWidth;
			canvas.style.maxHeight = canvasFullscreenStyle.maxHeight;
			canvas.style.zIndex = canvasFullscreenStyle.zIndex;
		}
		document.documentElement.style.overflow = canvasFullscreenHtmlOverflow;
		if (document.body)
			document.body.style.overflow = canvasFullscreenBodyOverflow;
	}

	canvasFullscreenStyle = null;
	canvasFullscreenFallback = false;
}

function PauseBackgroundMusic()
{
	if (backgroundAudio)
		backgroundAudio.pause();
}

async function ResumeBackgroundMusic(runtime)
{
	if (!IsBackgroundAudioLayout(runtime.layout.name))
		return;

	await backgroundAudioReady;
	if (!IsBackgroundAudioLayout(runtime.layout.name) || !backgroundAudio)
		return;

	backgroundAudio.loop = true;
	backgroundAudio.play().catch(error =>
	{
		console.warn("Fon müziği devam ettirilemedi:", error);
	});
}

function StopAllGameAudio()
{
	if (karaokePauseButtonTimer !== null)
	{
		clearTimeout(karaokePauseButtonTimer);
		karaokePauseButtonTimer = null;
	}

	StopKaraokeVideo();

	if (listenPlayButtonTimer !== null)
	{
		clearTimeout(listenPlayButtonTimer);
		listenPlayButtonTimer = null;
	}

	StopListenVideo();

	if (songtimeTimer !== null)
	{
		clearTimeout(songtimeTimer);
		songtimeTimer = null;
	}

	if (chooseTimer !== null)
	{
		clearTimeout(chooseTimer);
		chooseTimer = null;
	}

	if (bestTimer !== null)
	{
		clearTimeout(bestTimer);
		bestTimer = null;
	}

	StopSongtimeAudio();
	StopChooseAudio();
	StopAudioElement(bestAudio);
	StopAudioElement(listenAudio);
	StopAudioElement(karaokeAudio);
	StopAudioElement(backgroundAudio);
}

function UnlockAudioElement(audio)
{
	if (!audio)
		return;

	audio.muted = true;
	const unlockPromise = audio.play();
	unlockPromise?.then(() =>
	{
		audio.pause();
		audio.currentTime = 0;
	}).catch(() =>
	{
		// Sonraki kullanıcı etkileşiminde tekrar denenecek.
	});
}

function UnlockSongtimeAudio(runtime)
{
	if (!songtimeAudio)
		return;

	songtimeAudio.muted = true;
	const unlockPromise = songtimeAudio.play();
	if (unlockPromise?.then)
	{
		unlockPromise.then(() =>
		{
			songtimeAudio.pause();
			songtimeAudio.currentTime = 0;

			// İlk layout doğrudan kapak ise autoplay denemesi daha önce
			// reddedilmiş olabilir; kullanıcı etkileşiminden sonra yeniden dene.
			if (runtime.layout.name.toLowerCase() === "kapak" && songtimeTimer === null)
				PlaySongtimeAudio(runtime);
		}).catch(() =>
		{
			// Ses kilidi henüz açılamadı; sonraki kullanıcı etkileşimi tekrar dener.
		});
	}
}

function StopSongtimeAudio()
{
	if (!songtimeAudio)
		return;

	songtimeAudio.pause();
		songtimeAudio.currentTime = 0;
}

function GetButtonNameUnderPointer(runtime, clientX, clientY)
{
	// Secondary layoutlarda isim eşleştirmesini doğrudan object type üzerinden
	// yap; family instance'ının objectType adına güvenme.
	const secondaryButtonNames = [
		"btn_listen",
		"btn_karaoke",
		"btn_home",
		"btn_kategori",
		"btn_ekrankucult",
		"btn_ekrankapla",
		"btn_seskapat",
		"btn_secac",
		"btn_play",
		"btn_pause"
	];

	for (const buttonName of secondaryButtonNames)
	{
		const button = runtime.objects[buttonName]?.getFirstInstance();
		if (button && IsPointerOverButton(button, clientX, clientY))
			return buttonName;
	}

	return "";
}

function HandleScreenFullscreenButton(runtime, buttonName)
{
	if (IsMobileDevice())
		return HandleMobileScreenFullscreenButton(runtime, buttonName);

	return HandleDesktopScreenFullscreenButton(runtime, buttonName);
}

function HandleDesktopScreenFullscreenButton(runtime, buttonName)
{
	if (buttonName === "btn_ekrankucult")
	{
		ExitFullscreenAndUpdateButtons(runtime);
	}
	else if (buttonName === "btn_ekrankapla")
	{
		EnterFullscreenAndUpdateButtons(runtime);
	}
	else
		return false;

	RefreshVideoBoundsSoon();
	if (runtime.layout.name.toLowerCase() === "kapak")
		UpdateCoverButtons(runtime);
	return true;
}

function HandleMobileScreenFullscreenButton(runtime, buttonName)
{
	if (buttonName === "btn_ekrankucult")
	{
		ExitFullscreenAndUpdateButtons(runtime);
	}
	else if (buttonName === "btn_ekrankapla")
	{
		EnterFullscreenAndUpdateButtons(runtime);
	}
	else
		return false;

	RefreshVideoBoundsSoon();
	if (runtime.layout.name.toLowerCase() === "kapak")
		UpdateCoverButtons(runtime);
	return true;
}

function EnterFullscreenAndUpdateButtons(runtime)
{
	EnterFullscreen().then(enteredFullscreen =>
	{
		if (!enteredFullscreen)
			return;

		MoveScreenButtonsToMaximized(runtime);
		RefreshVideoBoundsSoon();
		if (runtime.layout.name.toLowerCase() === "kapak")
			UpdateCoverButtons(runtime);
	});
}

function ExitFullscreenAndUpdateButtons(runtime)
{
	ExitFullscreen().then(exitedFullscreen =>
	{
		if (!exitedFullscreen)
			return;

		MoveScreenButtons(runtime);
		RefreshVideoBoundsSoon();
		if (runtime.layout.name.toLowerCase() === "kapak")
			UpdateCoverButtons(runtime);
	});
}

function HandleSecondaryLayoutButton(runtime, buttonName, clientX, clientY)
{
	const layoutName = runtime.layout.name.toLowerCase();
	const button = runtime.objects[buttonName]?.getFirstInstance();
	if (!button || !IsPointerOverButton(button, clientX, clientY))
		return false;

	if (buttonName === "btn_home")
		runtime.goToLayout("kapak");
	else if (layoutName === "sec" && buttonName === "btn_listen")
		runtime.goToLayout("listen");
	else if (layoutName === "sec" && buttonName === "btn_karaoke")
		runtime.goToLayout("karaoke");
	else if (buttonName === "btn_kategori")
		runtime.goToLayout("sec");
	else if (layoutName === "listen" && buttonName === "btn_play")
	{
		ResumeListenVideo();
		MovePlayPauseButtonsToPlay(runtime);
	}
	else if (layoutName === "listen" && buttonName === "btn_pause")
	{
		PauseListenVideo();
		MovePlayPauseButtonsToPause(runtime);
	}
	else if (layoutName === "karaoke" && buttonName === "btn_play")
	{
		ResumeKaraokeVideo();
		MovePlayPauseButtonsToPlay(runtime);
	}
	else if (layoutName === "karaoke" && buttonName === "btn_pause")
	{
		PauseKaraokeVideo();
		MovePlayPauseButtonsToPause(runtime);
	}
	else if (buttonName === "btn_ekrankucult")
	{
		ExitFullscreenAndUpdateButtons(runtime);
	}
	else if (buttonName === "btn_ekrankapla")
	{
		EnterFullscreenAndUpdateButtons(runtime);
	}
	else if (layoutName === "sec" && buttonName === "btn_seskapat")
	{
		PauseBackgroundMusic();
		MoveSecSoundButtonsToClosed(runtime);
		UpdateCoverButtons(runtime);
	}
	else if (layoutName === "sec" && buttonName === "btn_secac")
	{
		ResumeBackgroundMusic(runtime);
		MoveSecSoundButtonsToOpen(runtime);
		UpdateCoverButtons(runtime);
	}

	return true;
}

function IsPointerOverButton(button, clientX, clientY)
{
	if (!Number.isFinite(clientX) || !Number.isFinite(clientY))
		return false;

	// Construct performs the correct letterbox, scale and viewport conversion
	// for the active layer. Avoid a second manual 1920x1080 conversion here;
	// it becomes incorrect after mobile browser UI/fullscreen changes.
	if (!button.layer || typeof button.layer.cssPxToLayer !== "function")
		return false;

	const [x, y] = button.layer.cssPxToLayer(clientX, clientY);
	return button.containsPoint(x, y)
		|| (
			Math.abs(x - button.x) <= Math.abs(button.width) / 2
			&& Math.abs(y - button.y) <= Math.abs(button.height) / 2
		);
}

function SetCoverButtonsFrame(runtime, frame)
{
	if (runtime.layout.name.toLowerCase() !== "kapak")
		return;

	for (const buttonName of coverButtonNames)
	{
		const button = runtime.objects[buttonName]?.getFirstInstance();
		if (button)
			SetButtonFrame(button, frame);
	}
}

function SetButtonFrame(button, frame)
{
	if (button.animation.frameCount >= 2)
		button.animationFrame = frame;
}

function MoveScreenButtons(runtime)
{
	const screenShrinkButton = runtime.objects.btn_ekrankucult?.getFirstInstance();
	const screenMaximizeButton = runtime.objects.btn_ekrankapla?.getFirstInstance();
	if (!screenShrinkButton || !screenMaximizeButton)
		return;

	screenShrinkButton.setPosition(1725, -80);
	screenMaximizeButton.setPosition(1725, 80);
}

function MoveScreenButtonsToMaximized(runtime)
{
	const screenShrinkButton = runtime.objects.btn_ekrankucult?.getFirstInstance();
	const screenMaximizeButton = runtime.objects.btn_ekrankapla?.getFirstInstance();
	if (!screenShrinkButton || !screenMaximizeButton)
		return;

	screenMaximizeButton.setPosition(1725, -80);
	screenShrinkButton.setPosition(1725, 80);
}

function MoveSoundButtonsToClosed(runtime)
{
	const soundCloseButton = runtime.objects.btn_seskapat?.getFirstInstance();
	const soundOpenButton = runtime.objects.btn_secac?.getFirstInstance();
	if (!soundCloseButton || !soundOpenButton)
		return;

	soundCloseButton.setPosition(1592, -80);
	soundOpenButton.setPosition(1610, 80);
}

function MoveSoundButtonsToOpen(runtime)
{
	const soundCloseButton = runtime.objects.btn_seskapat?.getFirstInstance();
	const soundOpenButton = runtime.objects.btn_secac?.getFirstInstance();
	if (!soundCloseButton || !soundOpenButton)
		return;

	soundOpenButton.setPosition(1592, -80);
	soundCloseButton.setPosition(1610, 80);
}

function MoveSecSoundButtonsToClosed(runtime)
{
	const soundCloseButton = runtime.objects.btn_seskapat?.getFirstInstance();
	const soundOpenButton = runtime.objects.btn_secac?.getFirstInstance();
	if (!soundCloseButton || !soundOpenButton)
		return;

	soundCloseButton.setPosition(1610, -80);
	soundOpenButton.setPosition(1610, 80);
}

function MoveSecSoundButtonsToOpen(runtime)
{
	const soundCloseButton = runtime.objects.btn_seskapat?.getFirstInstance();
	const soundOpenButton = runtime.objects.btn_secac?.getFirstInstance();
	if (!soundCloseButton || !soundOpenButton)
		return;

	soundOpenButton.setPosition(1610, -80);
	soundCloseButton.setPosition(1610, 80);
}

function MoveSecScreenButtonsToShrink(runtime)
{
	const screenShrinkButton = runtime.objects.btn_ekrankucult?.getFirstInstance();
	const screenMaximizeButton = runtime.objects.btn_ekrankapla?.getFirstInstance();
	if (!screenShrinkButton || !screenMaximizeButton)
		return;

	ExitFullscreen().then(exitedFullscreen =>
	{
		if (!exitedFullscreen)
			return;

		screenShrinkButton.setPosition(1725, 80);
		screenMaximizeButton.setPosition(1725, -80);
	});
}

function MoveSecScreenButtonsToMaximize(runtime)
{
	const screenShrinkButton = runtime.objects.btn_ekrankucult?.getFirstInstance();
	const screenMaximizeButton = runtime.objects.btn_ekrankapla?.getFirstInstance();
	if (!screenShrinkButton || !screenMaximizeButton)
		return;

	EnterFullscreen().then(enteredFullscreen =>
	{
		if (!enteredFullscreen)
			return;

		screenMaximizeButton.setPosition(1725, -80);
		screenShrinkButton.setPosition(1725, 80);
	});
}

function MovePlayPauseButtonsToPlay(runtime)
{
	const playButton = runtime.objects.btn_play?.getFirstInstance();
	const pauseButton = runtime.objects.btn_pause?.getFirstInstance();
	if (!playButton || !pauseButton)
		return;

	playButton.setPosition(1495, -80);
	pauseButton.setPosition(1495, 80);
}

function MovePlayPauseButtonsToPause(runtime)
{
	const playButton = runtime.objects.btn_play?.getFirstInstance();
	const pauseButton = runtime.objects.btn_pause?.getFirstInstance();
	if (!playButton || !pauseButton)
		return;

	pauseButton.setPosition(1495, -80);
	playButton.setPosition(1495, 80);
}
