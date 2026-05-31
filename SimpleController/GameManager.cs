using UnityEngine;

/// <summary>
/// Типы персонажей
/// </summary>
public enum CharacterType
{
    Human,
    SCP
}

/// <summary>
/// GameManager - запоминает выбор персонажа и настраивает игрока при загрузке сцены.
/// 
/// Использование:
/// 1. Повесьте этот скрипт на пустой GameObject в игровой сцене
/// 2. Убедитесь что у игрока стоит тег "Player" или есть CharacterController/Rigidbody
/// 3. Выбор персонажа из MainMenu автоматически применится
/// </summary>
public class GameManager : MonoBehaviour
{
    /// <summary>
    /// Статическое поле - хранит выбор между сценами
    /// </summary>
    public static CharacterType SelectedCharacter = CharacterType.Human;

    [Header("Настройки")]
    [Tooltip("Тег объекта игрока (если пусто - ищет по CharacterController или Rigidbody)")]
    public string playerTag = "Player";

    [Tooltip("Показать выбранного персонажа в консоль")]
    public bool debugMode = true;

    private GameObject playerObject;

    void Start()
    {
        // Находим игрока
        playerObject = FindPlayer();

        if (playerObject == null)
        {
            Debug.LogError("[GameManager] Не удалось найти объект игрока! Убедитесь что у него тег 'Player' или есть CharacterController/Rigidbody.");
            return;
        }

        if (debugMode)
        {
            Debug.Log($"[GameManager] Выбран персонаж: {SelectedCharacter}. Игрок: {playerObject.name}");
        }

        // Применяем способности в зависимости от выбора
        ApplyCharacterAbilities();
    }

    GameObject FindPlayer()
    {
        // Сначала ищем по тегу
        if (!string.IsNullOrEmpty(playerTag))
        {
            GameObject tagged = GameObject.FindGameObjectWithTag(playerTag);
            if (tagged != null) return tagged;
        }

        // Если не нашли по тегу - ищем по CharacterController
        CharacterController cc = FindObjectOfType<CharacterController>();
        if (cc != null) return cc.gameObject;

        // Ищем по Rigidbody (исключая статические объекты)
        Rigidbody[] bodies = FindObjectsOfType<Rigidbody>();
        foreach (Rigidbody body in bodies)
        {
            if (!body.isKinematic)
            {
                return body.gameObject;
            }
        }

        return null;
    }

    void ApplyCharacterAbilities()
    {
        if (playerObject == null) return;

        switch (SelectedCharacter)
        {
            case CharacterType.SCP:
                // Добавляем способность телепортации
                SCPTeleport teleport = playerObject.GetComponent<SCPTeleport>();
                if (teleport == null)
                {
                    teleport = playerObject.AddComponent<SCPTeleport>();
                }
                teleport.enabled = true;

                if (debugMode)
                {
                    Debug.Log("[GameManager] Добавлена способность телепортации (ЛКМ зажать + отпустить)");
                }
                break;

            case CharacterType.Human:
                // Убираем способность телепортации если есть
                SCPTeleport existingTeleport = playerObject.GetComponent<SCPTeleport>();
                if (existingTeleport != null)
                {
                    Destroy(existingTeleport);
                }

                if (debugMode)
                {
                    Debug.Log("[GameManager] Обычный персонаж без способностей");
                }
                break;
        }
    }
}
