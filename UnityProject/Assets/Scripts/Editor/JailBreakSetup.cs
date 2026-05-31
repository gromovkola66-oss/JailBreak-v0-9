using UnityEngine;
using UnityEditor;

public class JailBreakSetup : EditorWindow
{
    [MenuItem("JailBreak/Setup Player (Step 1)")]
    public static void SetupPlayer()
    {
        // ===== Clean up existing objects if re-running =====
        GameObject existingPlayer = GameObject.Find("Player");
        if (existingPlayer != null)
        {
            DestroyImmediate(existingPlayer);
        }

        GameObject existingFloor = GameObject.Find("Floor");
        if (existingFloor != null)
        {
            DestroyImmediate(existingFloor);
        }

        // ===== Create Player =====
        GameObject player = new GameObject("Player");
        player.transform.position = new Vector3(0f, 1f, 0f);

        // Add CharacterController
        CharacterController cc = player.AddComponent<CharacterController>();
        cc.height = 2f;
        cc.radius = 0.4f;
        cc.center = new Vector3(0f, 1f, 0f);

        // Add PlayerController script
        player.AddComponent<PlayerController>();

        // ===== Create CameraHolder =====
        GameObject cameraHolder = new GameObject("CameraHolder");
        cameraHolder.transform.SetParent(player.transform);
        cameraHolder.transform.localPosition = new Vector3(0f, 0.9f, 0f);
        cameraHolder.transform.localRotation = Quaternion.identity;

        // ===== Move or create Main Camera =====
        Camera mainCam = Camera.main;
        if (mainCam != null)
        {
            mainCam.transform.SetParent(cameraHolder.transform);
            mainCam.transform.localPosition = Vector3.zero;
            mainCam.transform.localRotation = Quaternion.identity;
        }
        else
        {
            GameObject camObj = new GameObject("Main Camera");
            camObj.tag = "MainCamera";
            camObj.AddComponent<Camera>();
            camObj.AddComponent<AudioListener>();
            camObj.transform.SetParent(cameraHolder.transform);
            camObj.transform.localPosition = Vector3.zero;
            camObj.transform.localRotation = Quaternion.identity;
        }

        // ===== Create Floor =====
        GameObject floor = GameObject.CreatePrimitive(PrimitiveType.Plane);
        floor.name = "Floor";
        floor.transform.position = Vector3.zero;
        floor.transform.localScale = new Vector3(10f, 1f, 10f);

        // Gray material for floor
        Renderer floorRenderer = floor.GetComponent<Renderer>();
        Material floorMat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
        floorMat.color = new Color(0.4f, 0.4f, 0.4f, 1f); // Dark gray
        floorRenderer.material = floorMat;

        // ===== Create a few reference boxes so you can see movement =====
        CreateColoredBox("Box_Red", new Vector3(5f, 1f, 5f), Color.red);
        CreateColoredBox("Box_Blue", new Vector3(-5f, 1f, -3f), Color.blue);
        CreateColoredBox("Box_Green", new Vector3(-3f, 1f, 8f), Color.green);
        CreateColoredBox("Box_Yellow", new Vector3(7f, 1f, -6f), Color.yellow);

        // ===== Select the player =====
        Selection.activeGameObject = player;

        // ===== Done =====
        Debug.Log("[JailBreak] Step 1 complete! Player + Floor created. Press Play to test.");
        Debug.Log("[JailBreak] Controls: WASD = move, Mouse = look, Space = jump, Shift = sprint, C/Ctrl = crouch");

        EditorUtility.DisplayDialog(
            "JailBreak - Step 1 Complete",
            "Player and Floor created!\n\n" +
            "Press PLAY to test.\n\n" +
            "Controls:\n" +
            "WASD - Move\n" +
            "Mouse - Look around\n" +
            "Space - Jump\n" +
            "Shift - Sprint\n" +
            "C or Ctrl - Crouch\n" +
            "Esc - Free cursor",
            "OK"
        );
    }

    private static void CreateColoredBox(string name, Vector3 position, Color color)
    {
        // Remove existing
        GameObject existing = GameObject.Find(name);
        if (existing != null)
        {
            DestroyImmediate(existing);
        }

        GameObject box = GameObject.CreatePrimitive(PrimitiveType.Cube);
        box.name = name;
        box.transform.position = position;
        box.transform.localScale = new Vector3(2f, 2f, 2f);

        Renderer renderer = box.GetComponent<Renderer>();
        Material mat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
        mat.color = color;
        renderer.material = mat;
    }
}
