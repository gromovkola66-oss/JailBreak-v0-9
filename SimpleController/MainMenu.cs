using UnityEngine;
using UnityEngine.UI;
using UnityEngine.SceneManagement;

/// <summary>
/// Главное меню с выбором персонажа.
/// Создает весь UI программно - просто повесьте этот скрипт на пустой GameObject в сцене меню.
/// 
/// Настройка:
/// 1. Создайте сцену "Menu" (Scene 0 в Build Settings)
/// 2. Создайте пустой GameObject и повесьте этот скрипт
/// 3. Укажите имя игровой сцены в поле gameSceneName
/// </summary>
public class MainMenu : MonoBehaviour
{
    [Header("Настройки")]
    [Tooltip("Имя сцены игры (должна быть в Build Settings)")]
    public string gameSceneName = "Game";

    [Header("Цвета")]
    public Color backgroundColor = new Color(0f, 0f, 0f, 0.85f);
    public Color buttonColorSCP = new Color(0.6f, 0.1f, 0.1f, 1f);
    public Color buttonColorHuman = new Color(0.2f, 0.4f, 0.7f, 1f);
    public Color titleColor = new Color(1f, 1f, 1f, 1f);
    public Color subtitleColor = new Color(0.8f, 0.8f, 0.8f, 1f);

    private Canvas canvas;

    void Awake()
    {
        // Останавливаем время и показываем курсор
        Time.timeScale = 0f;
        Cursor.lockState = CursorLockMode.None;
        Cursor.visible = true;

        CreateUI();
    }

    void CreateUI()
    {
        // --- CANVAS ---
        GameObject canvasObj = new GameObject("MenuCanvas");
        canvasObj.transform.SetParent(transform);
        canvas = canvasObj.AddComponent<Canvas>();
        canvas.renderMode = RenderMode.ScreenSpaceOverlay;
        canvas.sortingOrder = 100;
        canvasObj.AddComponent<CanvasScaler>().uiScaleMode = CanvasScaler.ScaleMode.ScaleWithScreenSize;
        canvasObj.GetComponent<CanvasScaler>().referenceResolution = new Vector2(1920, 1080);
        canvasObj.AddComponent<GraphicRaycaster>();

        // EventSystem (если его нет в сцене)
        if (FindObjectOfType<UnityEngine.EventSystems.EventSystem>() == null)
        {
            GameObject eventSystem = new GameObject("EventSystem");
            eventSystem.transform.SetParent(transform);
            eventSystem.AddComponent<UnityEngine.EventSystems.EventSystem>();
            eventSystem.AddComponent<UnityEngine.EventSystems.StandaloneInputModule>();
        }

        // --- ФОНОВАЯ ПАНЕЛЬ ---
        GameObject bgPanel = CreatePanel(canvasObj.transform, "Background", backgroundColor);
        RectTransform bgRect = bgPanel.GetComponent<RectTransform>();
        bgRect.anchorMin = Vector2.zero;
        bgRect.anchorMax = Vector2.one;
        bgRect.offsetMin = Vector2.zero;
        bgRect.offsetMax = Vector2.zero;

        // --- ЗАГОЛОВОК ---
        GameObject titleObj = CreateText(bgPanel.transform, "Title", "ВЫБЕРИ ПЕРСОНАЖА", 60, titleColor, TextAnchor.MiddleCenter);
        RectTransform titleRect = titleObj.GetComponent<RectTransform>();
        titleRect.anchorMin = new Vector2(0.5f, 0.5f);
        titleRect.anchorMax = new Vector2(0.5f, 0.5f);
        titleRect.pivot = new Vector2(0.5f, 0.5f);
        titleRect.anchoredPosition = new Vector2(0f, 200f);
        titleRect.sizeDelta = new Vector2(800f, 80f);

        // --- КНОПКА SCP ---
        CreateCharacterButton(
            bgPanel.transform,
            "BtnSCP",
            "SCP-106",
            "Телепортация (ЛКМ зажать + отпустить)",
            buttonColorSCP,
            new Vector2(-220f, -50f),
            () => SelectCharacter(CharacterType.SCP)
        );

        // --- КНОПКА ЧЕЛОВЕК ---
        CreateCharacterButton(
            bgPanel.transform,
            "BtnHuman",
            "Человек",
            "Обычный персонаж",
            buttonColorHuman,
            new Vector2(220f, -50f),
            () => SelectCharacter(CharacterType.Human)
        );
    }

    void CreateCharacterButton(Transform parent, string name, string title, string subtitle, Color color, Vector2 position, UnityEngine.Events.UnityAction onClick)
    {
        // Панель кнопки
        GameObject btnObj = new GameObject(name);
        btnObj.transform.SetParent(parent, false);

        RectTransform btnRect = btnObj.AddComponent<RectTransform>();
        btnRect.anchorMin = new Vector2(0.5f, 0.5f);
        btnRect.anchorMax = new Vector2(0.5f, 0.5f);
        btnRect.pivot = new Vector2(0.5f, 0.5f);
        btnRect.anchoredPosition = position;
        btnRect.sizeDelta = new Vector2(350f, 200f);

        Image btnImage = btnObj.AddComponent<Image>();
        btnImage.color = color;

        Button button = btnObj.AddComponent<Button>();
        button.targetGraphic = btnImage;
        button.onClick.AddListener(onClick);

        // Эффект при наведении
        ColorBlock colors = button.colors;
        colors.highlightedColor = new Color(color.r + 0.15f, color.g + 0.15f, color.b + 0.15f, 1f);
        colors.pressedColor = new Color(color.r - 0.1f, color.g - 0.1f, color.b - 0.1f, 1f);
        colors.normalColor = color;
        button.colors = colors;

        // Заголовок кнопки
        GameObject btnTitle = CreateText(btnObj.transform, "Title", title, 36, Color.white, TextAnchor.MiddleCenter);
        RectTransform btnTitleRect = btnTitle.GetComponent<RectTransform>();
        btnTitleRect.anchorMin = new Vector2(0f, 0.4f);
        btnTitleRect.anchorMax = new Vector2(1f, 1f);
        btnTitleRect.offsetMin = new Vector2(10f, 0f);
        btnTitleRect.offsetMax = new Vector2(-10f, -10f);

        // Подзаголовок кнопки
        GameObject btnSubtitle = CreateText(btnObj.transform, "Subtitle", subtitle, 18, subtitleColor, TextAnchor.UpperCenter);
        RectTransform btnSubRect = btnSubtitle.GetComponent<RectTransform>();
        btnSubRect.anchorMin = new Vector2(0f, 0f);
        btnSubRect.anchorMax = new Vector2(1f, 0.4f);
        btnSubRect.offsetMin = new Vector2(10f, 10f);
        btnSubRect.offsetMax = new Vector2(-10f, 0f);
    }

    GameObject CreatePanel(Transform parent, string name, Color color)
    {
        GameObject panel = new GameObject(name);
        panel.transform.SetParent(parent, false);
        panel.AddComponent<RectTransform>();
        Image img = panel.AddComponent<Image>();
        img.color = color;
        return panel;
    }

    GameObject CreateText(Transform parent, string name, string text, int fontSize, Color color, TextAnchor alignment)
    {
        GameObject textObj = new GameObject(name);
        textObj.transform.SetParent(parent, false);
        textObj.AddComponent<RectTransform>();

        Text textComponent = textObj.AddComponent<Text>();
        textComponent.text = text;
        textComponent.fontSize = fontSize;
        textComponent.color = color;
        textComponent.alignment = alignment;
        textComponent.font = Resources.GetBuiltinResource<Font>("LegacyRuntime.ttf");
        if (textComponent.font == null)
        {
            textComponent.font = Resources.GetBuiltinResource<Font>("Arial.ttf");
        }
        textComponent.horizontalOverflow = HorizontalWrapMode.Wrap;
        textComponent.verticalOverflow = VerticalWrapMode.Overflow;

        return textObj;
    }

    void SelectCharacter(CharacterType type)
    {
        // Сохраняем выбор
        GameManager.SelectedCharacter = type;

        // Возвращаем время
        Time.timeScale = 1f;

        // Загружаем игровую сцену
        SceneManager.LoadScene(gameSceneName);
    }
}
