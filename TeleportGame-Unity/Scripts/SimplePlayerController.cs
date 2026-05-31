using UnityEngine;

// Простой контроллер игрока: движение WASD, обзор мышью, прыжок, гравитация
[RequireComponent(typeof(CharacterController))]
public class SimplePlayerController : MonoBehaviour
{
    // Скорость передвижения
    [SerializeField] private float moveSpeed = 6f;

    // Высота прыжка
    [SerializeField] private float jumpHeight = 1.5f;

    // Сила гравитации
    [SerializeField] private float gravity = -20f;

    // Чувствительность мыши
    [SerializeField] private float mouseSensitivity = 2f;

    // Ссылка на камеру (если не задана, берётся главная камера)
    [SerializeField] private Transform cameraTransform;

    private CharacterController _controller;
    private Vector3 _velocity;
    private float _xRotation;

    private void Start()
    {
        _controller = GetComponent<CharacterController>();

        // Если камера не назначена вручную, используем основную камеру
        if (cameraTransform == null)
        {
            cameraTransform = Camera.main.transform;
        }

        // Блокируем и скрываем курсор
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }

    private void Update()
    {
        HandleMouseLook();
        HandleMovement();
    }

    // Обработка поворота камеры мышью
    private void HandleMouseLook()
    {
        float mouseX = Input.GetAxis("Mouse X") * mouseSensitivity;
        float mouseY = Input.GetAxis("Mouse Y") * mouseSensitivity;

        // Вертикальный поворот камеры (ограничен, чтобы не переворачивалась)
        _xRotation -= mouseY;
        _xRotation = Mathf.Clamp(_xRotation, -90f, 90f);

        cameraTransform.localRotation = Quaternion.Euler(_xRotation, 0f, 0f);

        // Горизонтальный поворот всего персонажа
        transform.Rotate(Vector3.up * mouseX);
    }

    // Обработка передвижения и прыжка
    private void HandleMovement()
    {
        // Если стоим на земле, сбрасываем вертикальную скорость
        if (_controller.isGrounded && _velocity.y < 0f)
        {
            _velocity.y = -2f;
        }

        // Получаем ввод WASD
        float horizontal = Input.GetAxis("Horizontal");
        float vertical = Input.GetAxis("Vertical");

        // Направление движения относительно поворота персонажа
        Vector3 moveDirection = transform.right * horizontal + transform.forward * vertical;
        _controller.Move(moveDirection * moveSpeed * Time.deltaTime);

        // Прыжок по нажатию пробела (только на земле)
        if (Input.GetButtonDown("Jump") && _controller.isGrounded)
        {
            _velocity.y = Mathf.Sqrt(jumpHeight * -2f * gravity);
        }

        // Применяем гравитацию
        _velocity.y += gravity * Time.deltaTime;
        _controller.Move(_velocity * Time.deltaTime);
    }
}
