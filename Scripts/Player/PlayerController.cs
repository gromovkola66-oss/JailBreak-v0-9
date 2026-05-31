using UnityEngine;
using UnityEngine.InputSystem;

public class PlayerController : MonoBehaviour
{
    [Header("Movement")]
    public float walkSpeed = 5f;
    public float sprintSpeed = 8.5f;
    public float crouchSpeed = 2.5f;
    public float jumpForce = 7f;
    public float gravity = -20f;

    [Header("Mouse Look")]
    public float mouseSensitivity = 2f;
    public float maxLookAngle = 85f;

    [Header("Crouch")]
    public float standHeight = 2f;
    public float crouchHeight = 1.2f;
    public float crouchTransitionSpeed = 8f;

    [Header("Weapon Bob")]
    public float bobSpeed = 10f;
    public float bobAmount = 0.05f;

    [Header("Interaction")]
    public float interactRange = 3f;

    [HideInInspector] public Team team = Team.None;
    [HideInInspector] public bool isDead = false;
    [HideInInspector] public string interactionPrompt = "";
    [HideInInspector] public bool isMoving = false;
    [HideInInspector] public bool isSprinting = false;
    public bool inputEnabled = false;

    private CharacterController controller;
    private Transform cameraTransform;
    private Vector3 velocity;
    private float xRotation = 0f;
    private bool isCrouching = false;
    private float bobTimer = 0f;
    private Vector3 originalCameraLocalPos;

    void Start()
    {
        controller = GetComponent<CharacterController>();
        cameraTransform = GetComponentInChildren<Camera>().transform;
        originalCameraLocalPos = cameraTransform.localPosition;
    }

    void Update()
    {
        if (!inputEnabled) return;
        if (isDead) return;

        Keyboard keyboard = Keyboard.current;
        Mouse mouse = Mouse.current;
        if (keyboard == null || mouse == null) return;

        HandleMouseLook(mouse);
        HandleMovement(keyboard);
        HandleCrouch(keyboard);
        HandleInteraction(keyboard);
        HandleWeaponBob();
    }

    private void HandleMouseLook(Mouse mouse)
    {
        Vector2 mouseDelta = mouse.delta.ReadValue();
        float mouseX = mouseDelta.x * mouseSensitivity * 0.1f;
        float mouseY = mouseDelta.y * mouseSensitivity * 0.1f;

        xRotation -= mouseY;
        xRotation = Mathf.Clamp(xRotation, -maxLookAngle, maxLookAngle);

        cameraTransform.localRotation = Quaternion.Euler(xRotation, 0f, 0f);
        transform.Rotate(Vector3.up * mouseX);
    }

    private void HandleMovement(Keyboard keyboard)
    {
        bool grounded = controller.isGrounded;
        if (grounded && velocity.y < 0f)
        {
            velocity.y = -2f;
        }

        float moveX = 0f;
        float moveZ = 0f;

        if (keyboard.wKey.isPressed) moveZ += 1f;
        if (keyboard.sKey.isPressed) moveZ -= 1f;
        if (keyboard.aKey.isPressed) moveX -= 1f;
        if (keyboard.dKey.isPressed) moveX += 1f;

        Vector3 move = transform.right * moveX + transform.forward * moveZ;
        if (move.magnitude > 1f) move.Normalize();

        isSprinting = keyboard.leftShiftKey.isPressed && !isCrouching && moveZ > 0f;
        float speed = isCrouching ? crouchSpeed : (isSprinting ? sprintSpeed : walkSpeed);

        isMoving = move.magnitude > 0.1f;

        controller.Move(move * speed * Time.deltaTime);

        if (keyboard.spaceKey.wasPressedThisFrame && grounded)
        {
            velocity.y = jumpForce;
        }

        velocity.y += gravity * Time.deltaTime;
        controller.Move(velocity * Time.deltaTime);
    }

    private void HandleCrouch(Keyboard keyboard)
    {
        if (keyboard.cKey.wasPressedThisFrame || keyboard.leftCtrlKey.wasPressedThisFrame)
        {
            isCrouching = !isCrouching;
        }

        float targetHeight = isCrouching ? crouchHeight : standHeight;
        controller.height = Mathf.Lerp(controller.height, targetHeight, crouchTransitionSpeed * Time.deltaTime);

        Vector3 camPos = cameraTransform.localPosition;
        float targetCamY = isCrouching ? crouchHeight - 0.2f : originalCameraLocalPos.y;
        camPos.y = Mathf.Lerp(camPos.y, targetCamY, crouchTransitionSpeed * Time.deltaTime);
        cameraTransform.localPosition = camPos;
    }

    private void HandleInteraction(Keyboard keyboard)
    {
        interactionPrompt = "";

        Ray ray = new Ray(cameraTransform.position, cameraTransform.forward);
        RaycastHit hit;

        if (Physics.Raycast(ray, out hit, interactRange))
        {
            IDoorInteractable interactable = hit.collider.GetComponent<IDoorInteractable>();
            if (interactable != null)
            {
                interactionPrompt = interactable.GetPrompt(this);
                if (keyboard.eKey.wasPressedThisFrame)
                {
                    interactable.Interact(this);
                }
            }
        }
    }

    private void HandleWeaponBob()
    {
        if (isMoving && controller.isGrounded)
        {
            float speedMultiplier = isSprinting ? 1.5f : 1f;
            bobTimer += Time.deltaTime * bobSpeed * speedMultiplier;
            float bobOffsetY = Mathf.Sin(bobTimer) * bobAmount;
            float bobOffsetX = Mathf.Cos(bobTimer * 0.5f) * bobAmount * 0.5f;

            Vector3 camPos = cameraTransform.localPosition;
            float targetCamY = isCrouching ? crouchHeight - 0.2f : originalCameraLocalPos.y;
            camPos.y = targetCamY + bobOffsetY;
            camPos.x = originalCameraLocalPos.x + bobOffsetX;
            cameraTransform.localPosition = camPos;
        }
        else
        {
            bobTimer = 0f;
        }
    }

    public void SetDead()
    {
        isDead = true;
        Camera cam = GetComponentInChildren<Camera>();
        if (cam != null) cam.enabled = false;
        SpectateCamera spectate = FindFirstObjectByType<SpectateCamera>();
        if (spectate != null)
        {
            spectate.EnableSpectate(cameraTransform.position, cameraTransform.rotation);
        }
    }

    public void Respawn(Vector3 position)
    {
        isDead = false;
        controller.enabled = false;
        transform.position = position;
        controller.enabled = true;
        velocity = Vector3.zero;
        Camera cam = GetComponentInChildren<Camera>();
        if (cam != null) cam.enabled = true;
    }

    public void EnableInput()
    {
        inputEnabled = true;
        Cursor.lockState = CursorLockMode.Locked;
        Cursor.visible = false;
    }

    public void DisableInput()
    {
        inputEnabled = false;
        Cursor.lockState = CursorLockMode.None;
        Cursor.visible = true;
    }
}

public interface IDoorInteractable
{
    string GetPrompt(PlayerController player);
    void Interact(PlayerController player);
}
