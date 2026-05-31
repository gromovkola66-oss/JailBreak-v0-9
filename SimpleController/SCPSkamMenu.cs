using UnityEngine;
using UnityEngine.SceneManagement;

/// <summary>
/// Красивое анимированное меню для игры SCP SKAM.
/// Просто добавьте этот скрипт на пустой GameObject в сцене.
/// Все UI создается программно через OnGUI - никаких префабов не нужно.
/// Работает в Unity 2021.3+
/// </summary>
public class SCPSkamMenu : MonoBehaviour
{
    // === ЦВЕТА ТЕМЫ ===
    private Color bgColor = new Color(0.102f, 0.039f, 0.039f, 1f);           // #1a0a0a - темный фон
    private Color darkRed = new Color(0.545f, 0f, 0f, 1f);                   // #8b0000 - темно-красный
    private Color brightRed = new Color(0.8f, 0f, 0f, 1f);                   // #cc0000 - яркий красный
    private Color buttonBg = new Color(0.3f, 0.02f, 0.02f, 0.9f);            // Фон кнопок
    private Color buttonHover = new Color(0.5f, 0.05f, 0.05f, 1f);           // Кнопка при наведении
    private Color panelColor = new Color(0.08f, 0.02f, 0.02f, 0.95f);        // Панель разработчика

    // === СОСТОЯНИЕ АНИМАЦИИ ===
    private float startTime;                    // Время запуска для анимаций
    private float[] buttonAlpha = { 0f, 0f, 0f }; // Прозрачность каждой кнопки (появление по очереди)
    private float titleGlitchTimer;             // Таймер глитч-эффекта заголовка
    private float titleOffsetX;                 // Смещение заголовка по X (глитч)
    private float titleOffsetY;                 // Смещение заголовка по Y (глитч)
    private float titleAlpha = 1f;              // Прозрачность заголовка (мерцание)
    private float scanlineOffset;               // Смещение сканлайнов
    private int hoveredButton = -1;             // Индекс кнопки под курсором
    private float[] buttonScale = { 1f, 1f, 1f }; // Масштаб кнопок (эффект наведения)

    // === СОСТОЯНИЕ ПАНЕЛИ РАЗРАБОТЧИКА ===
    private bool showDevPanel = false;          // Показать панель разработчика
    private float devPanelAlpha = 0f;           // Прозрачность панели (анимация появления)

    // === ТЕКСТУРЫ (создаются программно) ===
    private Texture2D bgTexture;                // Текстура фона
    private Texture2D buttonTexture;            // Текстура кнопки
    private Texture2D buttonHoverTexture;       // Текстура кнопки при наведении
    private Texture2D scanlineTexture;          // Текстура сканлайнов
    private Texture2D panelTexture;             // Текстура панели
    private Texture2D glowTexture;             // Текстура свечения для заголовка

    // === СТИЛИ GUI ===
    private GUIStyle titleStyle;
    private GUIStyle buttonStyle;
    private GUIStyle buttonHoverStyle;
    private GUIStyle devTextStyle;
    private GUIStyle closeBtnStyle;
    private bool stylesInitialized = false;

    // === НАСТРОЙКИ ===
    private const float BUTTON_FADE_DELAY = 0.4f;   // Задержка между появлением кнопок (сек)
    private const float BUTTON_FADE_SPEED = 2.5f;   // Скорость появления кнопок
    private const float GLITCH_INTERVAL = 3f;        // Интервал глитч-эффекта (сек)
    private const float GLITCH_DURATION = 0.15f;     // Длительность глитча (сек)
    private const float SCANLINE_SPEED = 30f;        // Скорость движения сканлайнов
    private const float HOVER_SCALE_SPEED = 8f;      // Скорость анимации наведения
    private const float HOVER_SCALE_MAX = 1.05f;     // Максимальный масштаб при наведении

    void Start()
    {
        // Настройка курсора и времени
        Cursor.visible = true;
        Cursor.lockState = CursorLockMode.None;
        Time.timeScale = 1f;

        startTime = Time.time;

        // Создание текстур программно
        CreateTextures();
    }

    /// <summary>
    /// Создает все необходимые текстуры программно
    /// </summary>
    void CreateTextures()
    {
        // Фоновая текстура
        bgTexture = MakeSolidTexture(2, 2, bgColor);

        // Текстура кнопки
        buttonTexture = MakeButtonTexture(256, 64, buttonBg);

        // Текстура кнопки при наведении
        buttonHoverTexture = MakeButtonTexture(256, 64, buttonHover);

        // Текстура панели
        panelTexture = MakeSolidTexture(2, 2, panelColor);

        // Текстура сканлайнов (полупрозрачные горизонтальные линии)
        scanlineTexture = MakeScanlineTexture(4, 128);

        // Текстура свечения (радиальный градиент красного)
        glowTexture = MakeGlowTexture(128, 128);
    }

    /// <summary>
    /// Создает однотонную текстуру заданного цвета
    /// </summary>
    Texture2D MakeSolidTexture(int width, int height, Color color)
    {
        Texture2D tex = new Texture2D(width, height);
        Color[] pixels = new Color[width * height];
        for (int i = 0; i < pixels.Length; i++)
            pixels[i] = color;
        tex.SetPixels(pixels);
        tex.Apply();
        return tex;
    }

    /// <summary>
    /// Создает текстуру кнопки с легким градиентом и рамкой
    /// </summary>
    Texture2D MakeButtonTexture(int width, int height, Color baseColor)
    {
        Texture2D tex = new Texture2D(width, height);
        Color[] pixels = new Color[width * height];

        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                // Градиент сверху вниз для объема
                float gradientT = (float)y / height;
                Color c = Color.Lerp(baseColor * 1.2f, baseColor * 0.8f, gradientT);

                // Рамка (граница кнопки)
                if (x == 0 || x == width - 1 || y == 0 || y == height - 1)
                    c = brightRed * 0.7f;

                // Вторая линия рамки для "округлости"
                if (x == 1 || x == width - 2 || y == 1 || y == height - 2)
                    c = Color.Lerp(c, brightRed * 0.4f, 0.3f);

                c.a = baseColor.a;
                pixels[y * width + x] = c;
            }
        }

        tex.SetPixels(pixels);
        tex.Apply();
        return tex;
    }

    /// <summary>
    /// Создает текстуру сканлайнов (эффект старого монитора)
    /// </summary>
    Texture2D MakeScanlineTexture(int width, int height)
    {
        Texture2D tex = new Texture2D(width, height);
        Color[] pixels = new Color[width * height];

        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                // Каждая вторая строка - полупрозрачная темная линия
                float alpha = (y % 4 < 2) ? 0.03f : 0f;
                pixels[y * width + x] = new Color(0f, 0f, 0f, alpha);
            }
        }

        tex.SetPixels(pixels);
        tex.Apply();
        tex.wrapMode = TextureWrapMode.Repeat;
        return tex;
    }

    /// <summary>
    /// Создает текстуру свечения (радиальный градиент)
    /// </summary>
    Texture2D MakeGlowTexture(int width, int height)
    {
        Texture2D tex = new Texture2D(width, height);
        Color[] pixels = new Color[width * height];
        Vector2 center = new Vector2(width / 2f, height / 2f);

        for (int y = 0; y < height; y++)
        {
            for (int x = 0; x < width; x++)
            {
                float dist = Vector2.Distance(new Vector2(x, y), center) / (width / 2f);
                float alpha = Mathf.Clamp01(1f - dist) * 0.3f;
                pixels[y * width + x] = new Color(0.8f, 0f, 0f, alpha);
            }
        }

        tex.SetPixels(pixels);
        tex.Apply();
        return tex;
    }

    void Update()
    {
        float elapsed = Time.time - startTime;

        // === Анимация появления кнопок (по очереди) ===
        for (int i = 0; i < 3; i++)
        {
            float delay = (i + 1) * BUTTON_FADE_DELAY + 0.5f; // Задержка для каждой кнопки
            if (elapsed > delay)
            {
                buttonAlpha[i] = Mathf.MoveTowards(buttonAlpha[i], 1f, Time.deltaTime * BUTTON_FADE_SPEED);
            }
        }

        // === Глитч-эффект заголовка ===
        titleGlitchTimer += Time.deltaTime;
        if (titleGlitchTimer > GLITCH_INTERVAL)
        {
            // Случайное смещение и мерцание
            titleOffsetX = Random.Range(-5f, 5f);
            titleOffsetY = Random.Range(-2f, 2f);
            titleAlpha = Random.Range(0.5f, 1f);

            if (titleGlitchTimer > GLITCH_INTERVAL + GLITCH_DURATION)
            {
                // Возврат в нормальное состояние
                titleGlitchTimer = 0f;
                titleOffsetX = 0f;
                titleOffsetY = 0f;
                titleAlpha = 1f;
            }
        }

        // Дополнительное легкое мерцание заголовка
        float flicker = Mathf.Sin(Time.time * 8f) * 0.05f;
        titleAlpha = Mathf.Clamp01(titleAlpha + flicker);

        // === Движение сканлайнов ===
        scanlineOffset += Time.deltaTime * SCANLINE_SPEED;
        if (scanlineOffset > 128f) scanlineOffset -= 128f;

        // === Анимация масштаба кнопок при наведении ===
        for (int i = 0; i < 3; i++)
        {
            float target = (hoveredButton == i) ? HOVER_SCALE_MAX : 1f;
            buttonScale[i] = Mathf.Lerp(buttonScale[i], target, Time.deltaTime * HOVER_SCALE_SPEED);
        }

        // === Анимация панели разработчика ===
        float devTarget = showDevPanel ? 1f : 0f;
        devPanelAlpha = Mathf.MoveTowards(devPanelAlpha, devTarget, Time.deltaTime * 4f);
    }

    /// <summary>
    /// Инициализация стилей GUI (вызывается один раз)
    /// </summary>
    void InitStyles()
    {
        // Стиль заголовка
        titleStyle = new GUIStyle(GUI.skin.label);
        titleStyle.fontSize = 82;
        titleStyle.fontStyle = FontStyle.Bold;
        titleStyle.alignment = TextAnchor.MiddleCenter;
        titleStyle.normal.textColor = Color.white;

        // Стиль кнопки
        buttonStyle = new GUIStyle(GUI.skin.button);
        buttonStyle.fontSize = 28;
        buttonStyle.fontStyle = FontStyle.Bold;
        buttonStyle.alignment = TextAnchor.MiddleCenter;
        buttonStyle.normal.textColor = Color.white;
        buttonStyle.normal.background = buttonTexture;
        buttonStyle.hover.textColor = new Color(1f, 0.8f, 0.8f);
        buttonStyle.hover.background = buttonHoverTexture;
        buttonStyle.active.textColor = Color.white;
        buttonStyle.active.background = buttonHoverTexture;
        buttonStyle.border = new RectOffset(4, 4, 4, 4);
        buttonStyle.padding = new RectOffset(20, 20, 12, 12);

        // Стиль кнопки при наведении (увеличенный)
        buttonHoverStyle = new GUIStyle(buttonStyle);
        buttonHoverStyle.fontSize = 30;
        buttonHoverStyle.normal.background = buttonHoverTexture;
        buttonHoverStyle.normal.textColor = new Color(1f, 0.85f, 0.85f);

        // Стиль текста панели разработчика
        devTextStyle = new GUIStyle(GUI.skin.label);
        devTextStyle.fontSize = 22;
        devTextStyle.alignment = TextAnchor.MiddleCenter;
        devTextStyle.normal.textColor = new Color(0.9f, 0.9f, 0.9f);
        devTextStyle.wordWrap = true;
        devTextStyle.padding = new RectOffset(20, 20, 20, 20);

        // Стиль кнопки закрытия
        closeBtnStyle = new GUIStyle(buttonStyle);
        closeBtnStyle.fontSize = 22;

        stylesInitialized = true;
    }

    void OnGUI()
    {
        // Инициализация стилей при первом вызове
        if (!stylesInitialized)
            InitStyles();

        float sw = Screen.width;
        float sh = Screen.height;

        // === ФОНОВЫЙ ФОН С ПУЛЬСАЦИЕЙ (эффект "дыхания") ===
        float pulse = Mathf.Sin(Time.time * 0.8f) * 0.02f;
        Color pulsedBg = new Color(
            bgColor.r + pulse,
            bgColor.g + pulse * 0.3f,
            bgColor.b + pulse * 0.3f,
            1f
        );
        GUI.color = pulsedBg;
        GUI.DrawTexture(new Rect(0, 0, sw, sh), bgTexture, ScaleMode.StretchToFill);
        GUI.color = Color.white;

        // === СВЕЧЕНИЕ ЗА ЗАГОЛОВКОМ ===
        float glowSize = 400f + Mathf.Sin(Time.time * 1.5f) * 30f;
        GUI.color = new Color(1f, 1f, 1f, 0.6f + Mathf.Sin(Time.time * 2f) * 0.15f);
        GUI.DrawTexture(new Rect(sw / 2f - glowSize / 2f, sh * 0.08f, glowSize, glowSize * 0.5f), glowTexture, ScaleMode.StretchToFill);
        GUI.color = Color.white;

        // === ЗАГОЛОВОК "SCP SKAM" С ГЛИТЧ-ЭФФЕКТОМ ===
        float titleY = sh * 0.12f;
        Rect titleRect = new Rect(titleOffsetX, titleY + titleOffsetY, sw, 100f);

        // Красная тень (эффект свечения текста)
        GUI.color = new Color(brightRed.r, brightRed.g, brightRed.b, titleAlpha * 0.6f);
        titleStyle.normal.textColor = brightRed;
        GUI.Label(new Rect(titleRect.x + 2f, titleRect.y + 2f, titleRect.width, titleRect.height), "SCP SKAM", titleStyle);

        // Основной белый текст заголовка
        GUI.color = new Color(1f, 1f, 1f, titleAlpha);
        titleStyle.normal.textColor = Color.white;
        GUI.Label(titleRect, "SCP SKAM", titleStyle);

        // Глитч-дубликат (смещенный красный) при активном глитче
        if (titleGlitchTimer > GLITCH_INTERVAL)
        {
            GUI.color = new Color(1f, 0f, 0f, 0.4f);
            titleStyle.normal.textColor = new Color(1f, 0f, 0f, 0.5f);
            GUI.Label(new Rect(titleRect.x + Random.Range(-3f, 3f), titleRect.y + Random.Range(-1f, 1f), titleRect.width, titleRect.height), "SCP SKAM", titleStyle);
        }

        GUI.color = Color.white;

        // === ПОДЗАГОЛОВОК ===
        GUIStyle subtitleStyle = new GUIStyle(GUI.skin.label);
        subtitleStyle.fontSize = 18;
        subtitleStyle.alignment = TextAnchor.MiddleCenter;
        subtitleStyle.normal.textColor = new Color(darkRed.r, darkRed.g, darkRed.b, 0.7f);
        GUI.Label(new Rect(0, titleY + 95f, sw, 30f), "[ SECURE. CONTAIN. PROTECT. ]", subtitleStyle);

        // === КНОПКИ МЕНЮ ===
        float buttonWidth = 350f;
        float buttonHeight = 60f;
        float buttonStartY = sh * 0.42f;
        float buttonSpacing = 80f;

        string[] buttonLabels = { "\u041d\u0410\u0427\u0410\u0422\u042c \u0418\u0413\u0420\u0410\u0422\u042c", "\u0420\u0410\u0417\u0420\u0410\u0411\u041e\u0422\u0427\u0418\u041a", "\u0412\u042b\u0425\u041e\u0414" };

        hoveredButton = -1; // Сброс состояния наведения

        for (int i = 0; i < 3; i++)
        {
            if (buttonAlpha[i] <= 0.01f) continue; // Не рисуем невидимые кнопки

            // Вычисление позиции кнопки с учетом масштаба
            float scale = buttonScale[i];
            float scaledW = buttonWidth * scale;
            float scaledH = buttonHeight * scale;
            float btnX = (sw - scaledW) / 2f;
            float btnY = buttonStartY + i * buttonSpacing - (scaledH - buttonHeight) / 2f;

            Rect btnRect = new Rect(btnX, btnY, scaledW, scaledH);

            // Проверка наведения мыши
            bool isHovered = btnRect.Contains(Event.current.mousePosition);
            if (isHovered) hoveredButton = i;

            // Установка прозрачности для анимации появления
            GUI.color = new Color(1f, 1f, 1f, buttonAlpha[i]);

            // Выбор стиля (обычный или при наведении)
            GUIStyle currentStyle = isHovered ? buttonHoverStyle : buttonStyle;

            // Рисуем кнопку
            if (GUI.Button(btnRect, buttonLabels[i], currentStyle))
            {
                OnButtonClick(i);
            }

            // Подсветка при наведении (дополнительный эффект)
            if (isHovered)
            {
                GUI.color = new Color(brightRed.r, brightRed.g, brightRed.b, 0.1f * buttonAlpha[i]);
                GUI.DrawTexture(btnRect, buttonHoverTexture, ScaleMode.StretchToFill);
            }
        }

        GUI.color = Color.white;

        // === ЭФФЕКТ СКАНЛАЙНОВ (движущиеся горизонтальные линии) ===
        if (scanlineTexture != null)
        {
            GUI.color = new Color(1f, 1f, 1f, 0.15f);
            // Рисуем сканлайны со смещением для эффекта движения
            Rect scanRect = new Rect(0, -scanlineOffset, sw, sh + 128f);
            GUI.DrawTextureWithTexCoords(scanRect, scanlineTexture, new Rect(0, 0, 1, sh / 4f));
            GUI.color = Color.white;
        }

        // === ВИНЬЕТКА (затемнение по краям) ===
        DrawVignette(sw, sh);

        // === ПАНЕЛЬ РАЗРАБОТЧИКА ===
        if (devPanelAlpha > 0.01f)
        {
            DrawDevPanel(sw, sh);
        }

        // === НИЖНИЙ ТЕКСТ (версия) ===
        GUIStyle versionStyle = new GUIStyle(GUI.skin.label);
        versionStyle.fontSize = 14;
        versionStyle.alignment = TextAnchor.LowerRight;
        versionStyle.normal.textColor = new Color(0.5f, 0.2f, 0.2f, 0.6f);
        GUI.Label(new Rect(sw - 210f, sh - 35f, 200f, 30f), "v0.1 // SCP FOUNDATION", versionStyle);
    }

    /// <summary>
    /// Рисует эффект виньетки (затемнение краев экрана)
    /// </summary>
    void DrawVignette(float sw, float sh)
    {
        // Верхнее затемнение
        GUI.color = new Color(0f, 0f, 0f, 0.4f);
        GUI.DrawTexture(new Rect(0, 0, sw, sh * 0.1f), bgTexture, ScaleMode.StretchToFill);

        // Нижнее затемнение
        GUI.DrawTexture(new Rect(0, sh * 0.9f, sw, sh * 0.1f), bgTexture, ScaleMode.StretchToFill);

        GUI.color = Color.white;
    }

    /// <summary>
    /// Рисует панель "Разработчик" с анимацией
    /// </summary>
    void DrawDevPanel(float sw, float sh)
    {
        // Затемнение фона
        GUI.color = new Color(0f, 0f, 0f, 0.7f * devPanelAlpha);
        GUI.DrawTexture(new Rect(0, 0, sw, sh), bgTexture, ScaleMode.StretchToFill);

        // Панель
        float panelW = Mathf.Min(600f, sw * 0.8f);
        float panelH = 320f;
        float panelX = (sw - panelW) / 2f;
        float panelY = (sh - panelH) / 2f;

        GUI.color = new Color(1f, 1f, 1f, devPanelAlpha);

        // Фон панели
        GUI.DrawTexture(new Rect(panelX, panelY, panelW, panelH), panelTexture, ScaleMode.StretchToFill);

        // Рамка панели
        DrawPanelBorder(panelX, panelY, panelW, panelH);

        // Заголовок панели
        GUIStyle panelTitle = new GUIStyle(GUI.skin.label);
        panelTitle.fontSize = 32;
        panelTitle.fontStyle = FontStyle.Bold;
        panelTitle.alignment = TextAnchor.MiddleCenter;
        panelTitle.normal.textColor = brightRed;
        GUI.Label(new Rect(panelX, panelY + 20f, panelW, 50f), "\u0420\u0410\u0417\u0420\u0410\u0411\u041e\u0422\u0427\u0418\u041a", panelTitle);

        // Разделительная линия
        GUI.color = new Color(brightRed.r, brightRed.g, brightRed.b, 0.5f * devPanelAlpha);
        GUI.DrawTexture(new Rect(panelX + 30f, panelY + 75f, panelW - 60f, 2f), buttonHoverTexture, ScaleMode.StretchToFill);
        GUI.color = new Color(1f, 1f, 1f, devPanelAlpha);

        // Текст разработчика
        devTextStyle.normal.textColor = new Color(0.9f, 0.9f, 0.9f, devPanelAlpha);
        GUI.Label(new Rect(panelX + 20f, panelY + 80f, panelW - 40f, 150f),
            "\u0410\u043b\u0438\u043a, \u0434\u043e\u0434\u0435\u043b\u0430\u0442\u044c \u043d\u0430\u0434\u043e \u043d\u0430\u0434\u043e \u043d\u0430\u0434\u043e \u043d\u0430\u0434\u043e \u043d\u0430\u0434\u043e \u043d\u0430\u0434\u043e \u043d\u0430\u0434\u043e \u043d\u0430\u0434\u043e \u043d\u0430\u0434\u043e \u043d\u0430\u0434\u043e \u043d\u0430\u0434\u043e \u043d\u0430\u0434\u043e", devTextStyle);

        // Кнопка "Закрыть"
        float closeBtnW = 200f;
        float closeBtnH = 50f;
        Rect closeRect = new Rect((sw - closeBtnW) / 2f, panelY + panelH - 70f, closeBtnW, closeBtnH);

        if (GUI.Button(closeRect, "\u0417\u0410\u041a\u0420\u042b\u0422\u042c", closeBtnStyle))
        {
            showDevPanel = false;
        }

        GUI.color = Color.white;
    }

    /// <summary>
    /// Рисует рамку вокруг панели
    /// </summary>
    void DrawPanelBorder(float x, float y, float w, float h)
    {
        float borderSize = 2f;
        Color borderColor = new Color(brightRed.r, brightRed.g, brightRed.b, 0.8f * devPanelAlpha);
        Texture2D borderTex = MakeSolidTexture(1, 1, borderColor);

        GUI.color = new Color(1f, 1f, 1f, devPanelAlpha);

        // Верх
        GUI.DrawTexture(new Rect(x, y, w, borderSize), borderTex);
        // Низ
        GUI.DrawTexture(new Rect(x, y + h - borderSize, w, borderSize), borderTex);
        // Лево
        GUI.DrawTexture(new Rect(x, y, borderSize, h), borderTex);
        // Право
        GUI.DrawTexture(new Rect(x + w - borderSize, y, borderSize, h), borderTex);

        // Освобождение временной текстуры
        Destroy(borderTex);
    }

    /// <summary>
    /// Обработка нажатия кнопок меню
    /// </summary>
    void OnButtonClick(int index)
    {
        switch (index)
        {
            case 0:
                // НАЧАТЬ ИГРАТЬ - загрузка следующей сцены
                SceneManager.LoadScene(1);
                break;

            case 1:
                // РАЗРАБОТЧИК - показать панель
                showDevPanel = true;
                break;

            case 2:
                // ВЫХОД - закрытие приложения
                #if UNITY_EDITOR
                UnityEditor.EditorApplication.isPlaying = false;
                #else
                Application.Quit();
                #endif
                break;
        }
    }

    /// <summary>
    /// Очистка текстур при уничтожении объекта
    /// </summary>
    void OnDestroy()
    {
        if (bgTexture != null) Destroy(bgTexture);
        if (buttonTexture != null) Destroy(buttonTexture);
        if (buttonHoverTexture != null) Destroy(buttonHoverTexture);
        if (scanlineTexture != null) Destroy(scanlineTexture);
        if (panelTexture != null) Destroy(panelTexture);
        if (glowTexture != null) Destroy(glowTexture);
    }
}
