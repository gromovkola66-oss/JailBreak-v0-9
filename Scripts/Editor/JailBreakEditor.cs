using UnityEngine;
using UnityEditor;

public class JailBreakEditor : EditorWindow
{
    // ============================================================
    // STEP 1: Setup Player
    // ============================================================
    [MenuItem("JailBreak/Step 1 - Setup Player")]
    public static void SetupPlayer()
    {
        // Clean up
        DestroyIfExists("Player");
        DestroyIfExists("Floor");
        DestroyIfExists("Box_Red");
        DestroyIfExists("Box_Blue");
        DestroyIfExists("Box_Green");
        DestroyIfExists("Box_Yellow");

        // Create Player
        GameObject player = new GameObject("Player");
        player.transform.position = new Vector3(0f, 1f, 0f);

        CharacterController cc = player.AddComponent<CharacterController>();
        cc.height = 2f;
        cc.radius = 0.4f;
        cc.center = new Vector3(0f, 1f, 0f);

        player.AddComponent<PlayerController>();

        // CameraHolder
        GameObject cameraHolder = new GameObject("CameraHolder");
        cameraHolder.transform.SetParent(player.transform);
        cameraHolder.transform.localPosition = new Vector3(0f, 0.9f, 0f);
        cameraHolder.transform.localRotation = Quaternion.identity;

        // Move Main Camera
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

        // Floor
        GameObject floor = GameObject.CreatePrimitive(PrimitiveType.Plane);
        floor.name = "Floor";
        floor.transform.position = Vector3.zero;
        floor.transform.localScale = new Vector3(10f, 1f, 10f);
        floor.GetComponent<Renderer>().material = CreateMat(new Color(0.4f, 0.4f, 0.4f));

        // Reference boxes
        CreateColoredBox("Box_Red", new Vector3(5f, 1f, 5f), Color.red);
        CreateColoredBox("Box_Blue", new Vector3(-5f, 1f, -3f), Color.blue);
        CreateColoredBox("Box_Green", new Vector3(-3f, 1f, 8f), Color.green);
        CreateColoredBox("Box_Yellow", new Vector3(7f, 1f, -6f), Color.yellow);

        Selection.activeGameObject = player;

        EditorUtility.DisplayDialog(
            "JailBreak - Step 1 Complete",
            "Player created!\n\nPress PLAY to test.\n\nWASD - Move\nMouse - Look\nSpace - Jump\nShift - Sprint\nC/Ctrl - Crouch",
            "OK"
        );
    }

    // ============================================================
    // STEP 2: Build Prison Map
    // ============================================================
    [MenuItem("JailBreak/Step 2 - Build Prison Map")]
    public static void BuildPrisonMap()
    {
        // Clean up
        DestroyIfExists("PrisonMap");
        DestroyIfExists("Floor");
        DestroyIfExists("Box_Red");
        DestroyIfExists("Box_Blue");
        DestroyIfExists("Box_Green");
        DestroyIfExists("Box_Yellow");

        GameObject map = new GameObject("PrisonMap");
        map.transform.position = Vector3.zero;

        // Materials
        Material wallMat = CreateMat(new Color(0.85f, 0.82f, 0.75f));
        Material floorMat = CreateMat(new Color(0.55f, 0.55f, 0.6f));
        Material ceilingMat = CreateMat(new Color(0.9f, 0.9f, 0.85f));
        Material cellWallMat = CreateMat(new Color(0.75f, 0.78f, 0.82f));
        Material doorFrameMat = CreateMat(new Color(0.3f, 0.3f, 0.35f));
        Material barsMat = CreateMat(new Color(0.25f, 0.25f, 0.3f));
        Material yardFloorMat = CreateMat(new Color(0.4f, 0.6f, 0.35f));
        Material yardWallMat = CreateMat(new Color(0.7f, 0.5f, 0.3f));
        Material guardRoomMat = CreateMat(new Color(0.3f, 0.4f, 0.6f));
        Material bedMat = CreateMat(new Color(0.6f, 0.4f, 0.2f));
        Material mattressMat = CreateMat(new Color(0.4f, 0.5f, 0.7f));
        Material toiletMat = CreateMat(new Color(0.9f, 0.9f, 0.95f));
        Material tableMat = CreateMat(new Color(0.5f, 0.35f, 0.2f));
        Material benchMat = CreateMat(new Color(0.6f, 0.45f, 0.25f));

        // Dimensions
        float corridorLength = 36f;
        float corridorWidth = 4f;
        float wallHeight = 4f;
        float wallThickness = 0.4f;
        float cellWidth = 5f;
        float cellDepth = 4f;
        int cellsPerSide = 3;
        float cellSpacing = corridorLength / cellsPerSide;

        // Corridor floor
        CreateBox("Corridor_Floor", map, new Vector3(0, 0, 0), new Vector3(corridorWidth, 0.2f, corridorLength), floorMat);

        // Corridor ceiling
        CreateBox("Corridor_Ceiling", map, new Vector3(0, wallHeight, 0), new Vector3(corridorWidth + wallThickness * 2, 0.3f, corridorLength), ceilingMat);

        // Back wall
        CreateBox("Corridor_BackWall", map, new Vector3(0, wallHeight / 2, -corridorLength / 2), new Vector3(corridorWidth + wallThickness * 2 + cellDepth * 2 + 2f, wallHeight, wallThickness), wallMat);

        // Cells - left side
        for (int i = 0; i < cellsPerSide; i++)
        {
            float zPos = -corridorLength / 2 + cellSpacing * i + cellSpacing / 2;
            BuildCell("CellL" + (i + 1), map, new Vector3(-corridorWidth / 2 - cellDepth / 2, 0, zPos), cellWidth, cellDepth, wallHeight, cellWallMat, floorMat, ceilingMat, barsMat, doorFrameMat, bedMat, mattressMat, toiletMat, true);
        }

        // Cells - right side
        for (int i = 0; i < cellsPerSide; i++)
        {
            float zPos = -corridorLength / 2 + cellSpacing * i + cellSpacing / 2;
            BuildCell("CellR" + (i + 1), map, new Vector3(corridorWidth / 2 + cellDepth / 2, 0, zPos), cellWidth, cellDepth, wallHeight, cellWallMat, floorMat, ceilingMat, barsMat, doorFrameMat, bedMat, mattressMat, toiletMat, false);
        }

        // Divider walls between cells - left
        for (int i = 0; i <= cellsPerSide; i++)
        {
            float zPos = -corridorLength / 2 + cellSpacing * i;
            CreateBox("WallL_Div" + i, map, new Vector3(-corridorWidth / 2 - cellDepth / 2, wallHeight / 2, zPos), new Vector3(cellDepth, wallHeight, wallThickness), cellWallMat);
        }

        // Divider walls between cells - right
        for (int i = 0; i <= cellsPerSide; i++)
        {
            float zPos = -corridorLength / 2 + cellSpacing * i;
            CreateBox("WallR_Div" + i, map, new Vector3(corridorWidth / 2 + cellDepth / 2, wallHeight / 2, zPos), new Vector3(cellDepth, wallHeight, wallThickness), cellWallMat);
        }

        // Outer walls
        CreateBox("OuterWall_Left", map, new Vector3(-corridorWidth / 2 - cellDepth - wallThickness / 2, wallHeight / 2, 0), new Vector3(wallThickness, wallHeight, corridorLength), wallMat);
        CreateBox("OuterWall_Right", map, new Vector3(corridorWidth / 2 + cellDepth + wallThickness / 2, wallHeight / 2, 0), new Vector3(wallThickness, wallHeight, corridorLength), wallMat);

        // === YARD ===
        float yardSize = 16f;
        float yardZ = corridorLength / 2 + yardSize / 2;

        CreateBox("Yard_Floor", map, new Vector3(0, 0, yardZ), new Vector3(yardSize, 0.2f, yardSize), yardFloorMat);
        CreateBox("Yard_WallLeft", map, new Vector3(-yardSize / 2, wallHeight / 2, yardZ), new Vector3(wallThickness, wallHeight, yardSize), yardWallMat);
        CreateBox("Yard_WallRight", map, new Vector3(yardSize / 2, wallHeight / 2, yardZ), new Vector3(wallThickness, wallHeight, yardSize), yardWallMat);
        CreateBox("Yard_WallBack", map, new Vector3(0, wallHeight / 2, yardZ + yardSize / 2), new Vector3(yardSize, wallHeight, wallThickness), yardWallMat);
        CreateBox("Yard_FrontL", map, new Vector3(-yardSize / 4 - 1f, wallHeight / 2, yardZ - yardSize / 2), new Vector3(yardSize / 2 - 2f, wallHeight, wallThickness), yardWallMat);
        CreateBox("Yard_FrontR", map, new Vector3(yardSize / 4 + 1f, wallHeight / 2, yardZ - yardSize / 2), new Vector3(yardSize / 2 - 2f, wallHeight, wallThickness), yardWallMat);

        // Yard furniture
        CreateBox("Yard_Bench1", map, new Vector3(-4f, 0.4f, yardZ + 3f), new Vector3(3f, 0.3f, 0.8f), benchMat);
        CreateBox("Yard_Bench2", map, new Vector3(4f, 0.4f, yardZ - 3f), new Vector3(3f, 0.3f, 0.8f), benchMat);
        CreateBox("Yard_Table", map, new Vector3(0, 0.7f, yardZ + 5f), new Vector3(2f, 0.15f, 1.5f), tableMat);

        // === GUARD ROOM ===
        float guardX = -corridorWidth / 2 - cellDepth - 6f;
        float guardZ = -corridorLength / 2 + 6f;
        float guardW = 5f;
        float guardD = 5f;

        CreateBox("Guard_Floor", map, new Vector3(guardX, 0, guardZ), new Vector3(guardW, 0.2f, guardD), floorMat);
        CreateBox("Guard_Ceiling", map, new Vector3(guardX, wallHeight, guardZ), new Vector3(guardW, 0.3f, guardD), ceilingMat);
        CreateBox("Guard_WallBack", map, new Vector3(guardX, wallHeight / 2, guardZ - guardD / 2), new Vector3(guardW, wallHeight, wallThickness), guardRoomMat);
        CreateBox("Guard_WallFront", map, new Vector3(guardX, wallHeight / 2, guardZ + guardD / 2), new Vector3(guardW, wallHeight, wallThickness), guardRoomMat);
        CreateBox("Guard_WallLeft", map, new Vector3(guardX - guardW / 2, wallHeight / 2, guardZ), new Vector3(wallThickness, wallHeight, guardD), guardRoomMat);
        CreateBox("Guard_Desk", map, new Vector3(guardX - 1f, 0.7f, guardZ - 1f), new Vector3(2.5f, 0.15f, 1.2f), tableMat);

        // === LIGHTS ===
        CreateLight("Light_Corridor1", map, new Vector3(0, wallHeight - 0.5f, -8f), new Color(1f, 0.95f, 0.8f), 12f);
        CreateLight("Light_Corridor2", map, new Vector3(0, wallHeight - 0.5f, 4f), new Color(1f, 0.95f, 0.8f), 12f);
        CreateLight("Light_Corridor3", map, new Vector3(0, wallHeight - 0.5f, -20f), new Color(1f, 0.95f, 0.8f), 12f);
        CreateLight("Light_Yard", map, new Vector3(0, wallHeight + 2f, yardZ), new Color(1f, 1f, 0.9f), 20f);
        CreateLight("Light_Guard", map, new Vector3(guardX, wallHeight - 0.5f, guardZ), new Color(0.8f, 0.9f, 1f), 8f);

        // Move player to spawn
        GameObject player = GameObject.Find("Player");
        if (player != null)
        {
            player.transform.position = new Vector3(0f, 1f, -corridorLength / 2 + 2f);
        }

        EditorUtility.DisplayDialog(
            "JailBreak - Step 2 Complete",
            "Prison Map created!\n\n- 6 cells (3 per side)\n- Main corridor\n- Yard with benches\n- Guard room\n\nPress PLAY to explore!",
            "OK"
        );
    }

    // ============================================================
    // STEP 3: Setup Weapons
    // ============================================================
    [MenuItem("JailBreak/Step 3 - Setup Weapons")]
    public static void SetupWeapons()
    {
        GameObject player = GameObject.Find("Player");
        if (player == null)
        {
            EditorUtility.DisplayDialog("Error", "Player not found! Run Step 1 first.", "OK");
            return;
        }

        // Remove old weapon setup
        Transform oldHolder = player.transform.Find("CameraHolder/Main Camera/WeaponHolder");
        if (oldHolder != null) DestroyImmediate(oldHolder.gameObject);

        // Remove old WeaponController
        WeaponController oldWC = player.GetComponent<WeaponController>();
        if (oldWC != null) DestroyImmediate(oldWC);

        // Find camera
        Transform cam = player.transform.Find("CameraHolder/Main Camera");
        if (cam == null)
        {
            cam = player.transform.Find("CameraHolder");
            if (cam == null)
            {
                EditorUtility.DisplayDialog("Error", "Camera not found! Run Step 1 first.", "OK");
                return;
            }
        }

        // Create WeaponHolder (attached to camera so it moves with view)
        GameObject weaponHolder = new GameObject("WeaponHolder");
        weaponHolder.transform.SetParent(cam);
        weaponHolder.transform.localPosition = new Vector3(0.3f, -0.25f, 0.5f);
        weaponHolder.transform.localRotation = Quaternion.identity;

        // Materials
        Material metalDark = CreateMat(new Color(0.2f, 0.2f, 0.22f));
        Material metalLight = CreateMat(new Color(0.35f, 0.35f, 0.38f));
        Material woodMat = CreateMat(new Color(0.45f, 0.3f, 0.15f));
        Material orangeMat = CreateMat(new Color(0.9f, 0.5f, 0.1f));

        // === AK-47 MODEL ===
        GameObject ak47 = new GameObject("AK47_Model");
        ak47.transform.SetParent(weaponHolder.transform);
        ak47.transform.localPosition = Vector3.zero;
        ak47.transform.localRotation = Quaternion.identity;

        // Body
        CreateBoxLocal("AK_Body", ak47, new Vector3(0, 0, 0.15f), new Vector3(0.06f, 0.08f, 0.5f), metalDark);
        // Barrel
        CreateBoxLocal("AK_Barrel", ak47, new Vector3(0, 0.01f, 0.55f), new Vector3(0.03f, 0.03f, 0.35f), metalDark);
        // Stock
        CreateBoxLocal("AK_Stock", ak47, new Vector3(0, -0.02f, -0.2f), new Vector3(0.04f, 0.06f, 0.25f), woodMat);
        // Magazine
        CreateBoxLocal("AK_Magazine", ak47, new Vector3(0, -0.1f, 0.1f), new Vector3(0.04f, 0.12f, 0.08f), metalDark);
        // Grip
        CreateBoxLocal("AK_Grip", ak47, new Vector3(0, -0.08f, -0.02f), new Vector3(0.03f, 0.08f, 0.04f), woodMat);
        // Handguard
        CreateBoxLocal("AK_Handguard", ak47, new Vector3(0, -0.01f, 0.35f), new Vector3(0.05f, 0.06f, 0.15f), woodMat);

        // === SHOTGUN MODEL ===
        GameObject shotgun = new GameObject("Shotgun_Model");
        shotgun.transform.SetParent(weaponHolder.transform);
        shotgun.transform.localPosition = Vector3.zero;
        shotgun.transform.localRotation = Quaternion.identity;

        // Body
        CreateBoxLocal("SG_Body", shotgun, new Vector3(0, 0, 0.1f), new Vector3(0.06f, 0.07f, 0.35f), metalDark);
        // Barrel (thicker)
        CreateBoxLocal("SG_Barrel", shotgun, new Vector3(0, 0.01f, 0.45f), new Vector3(0.045f, 0.045f, 0.4f), metalDark);
        // Pump
        CreateBoxLocal("SG_Pump", shotgun, new Vector3(0, -0.02f, 0.35f), new Vector3(0.055f, 0.055f, 0.12f), metalLight);
        // Stock
        CreateBoxLocal("SG_Stock", shotgun, new Vector3(0, -0.02f, -0.15f), new Vector3(0.05f, 0.07f, 0.2f), woodMat);
        // Grip
        CreateBoxLocal("SG_Grip", shotgun, new Vector3(0, -0.08f, -0.02f), new Vector3(0.03f, 0.08f, 0.04f), woodMat);

        // === PISTOL MODEL ===
        GameObject pistol = new GameObject("Pistol_Model");
        pistol.transform.SetParent(weaponHolder.transform);
        pistol.transform.localPosition = Vector3.zero;
        pistol.transform.localRotation = Quaternion.identity;

        // Slide
        CreateBoxLocal("PT_Slide", pistol, new Vector3(0, 0.01f, 0.05f), new Vector3(0.04f, 0.045f, 0.2f), metalDark);
        // Frame
        CreateBoxLocal("PT_Frame", pistol, new Vector3(0, -0.02f, 0.02f), new Vector3(0.035f, 0.03f, 0.15f), metalLight);
        // Grip
        CreateBoxLocal("PT_Grip", pistol, new Vector3(0, -0.07f, -0.02f), new Vector3(0.035f, 0.08f, 0.04f), metalDark);
        // Magazine base
        CreateBoxLocal("PT_MagBase", pistol, new Vector3(0, -0.11f, -0.02f), new Vector3(0.03f, 0.02f, 0.035f), metalLight);

        // === MUZZLE FLASH ===
        GameObject muzzleFlash = new GameObject("MuzzleFlash");
        muzzleFlash.transform.SetParent(weaponHolder.transform);
        muzzleFlash.transform.localPosition = new Vector3(0, 0.01f, 0.75f);

        GameObject flashVisual = GameObject.CreatePrimitive(PrimitiveType.Sphere);
        flashVisual.name = "FlashSphere";
        flashVisual.transform.SetParent(muzzleFlash.transform);
        flashVisual.transform.localPosition = Vector3.zero;
        flashVisual.transform.localScale = new Vector3(0.1f, 0.1f, 0.15f);
        Object.DestroyImmediate(flashVisual.GetComponent<Collider>());
        flashVisual.GetComponent<Renderer>().material = orangeMat;

        // Add point light for flash
        Light flashLight = muzzleFlash.AddComponent<Light>();
        flashLight.type = LightType.Point;
        flashLight.color = new Color(1f, 0.7f, 0.3f);
        flashLight.range = 5f;
        flashLight.intensity = 3f;

        muzzleFlash.SetActive(false);

        // === ADD WEAPON CONTROLLER ===
        WeaponController wc = player.GetComponent<WeaponController>();
        if (wc == null) wc = player.AddComponent<WeaponController>();
        wc.cameraTransform = cam;

        // === ADD UI ===
        GameObject uiObj = GameObject.Find("WeaponUI");
        if (uiObj == null)
        {
            uiObj = new GameObject("WeaponUI");
            uiObj.AddComponent<WeaponUI>();
        }

        EditorUtility.DisplayDialog(
            "JailBreak - Step 3 Complete",
            "Weapons created!\n\n" +
            "- AK-47 (key 1)\n" +
            "- Shotgun (key 2)\n" +
            "- Pistol (key 3)\n\n" +
            "Controls:\n" +
            "LMB - Shoot\n" +
            "R - Reload\n" +
            "1/2/3 or Scroll - Switch weapon\n\n" +
            "Press PLAY to test!",
            "OK"
        );
    }

    // ============================================================
    // STEP 4: Setup Inventory
    // ============================================================
    [MenuItem("JailBreak/Step 4 - Setup Inventory")]
    public static void SetupInventory()
    {
        GameObject player = GameObject.Find("Player");
        if (player == null)
        {
            EditorUtility.DisplayDialog("Error", "Player not found! Run Step 1 first.", "OK");
            return;
        }

        // Add InventorySystem to player
        InventorySystem inv = player.GetComponent<InventorySystem>();
        if (inv == null) inv = player.AddComponent<InventorySystem>();

        // Add InventoryUI (global)
        DestroyIfExists("InventoryUI");
        GameObject uiObj = new GameObject("InventoryUI");
        uiObj.AddComponent<InventoryUI>();

        // Clean old pickups
        GameObject oldPickups = GameObject.Find("Pickups");
        if (oldPickups != null) DestroyImmediate(oldPickups);

        // Create parent for pickups
        GameObject pickups = new GameObject("Pickups");
        pickups.transform.position = Vector3.zero;

        // Spawn items around the map
        // Corridor items
        CreatePickup("Pickup_Pistol", pickups, new Vector3(0f, 0.7f, -10f), ItemData.Pistol(), new Color(0.25f, 0.25f, 0.3f));
        CreatePickup("Pickup_Medkit1", pickups, new Vector3(1.5f, 0.7f, -4f), ItemData.Medkit(), new Color(0.9f, 0.2f, 0.2f));
        CreatePickup("Pickup_Ammo1", pickups, new Vector3(-1f, 0.7f, 2f), ItemData.AmmoBox(), new Color(0.5f, 0.5f, 0.2f));

        // Guard room items
        float guardX = -8.5f;
        float guardZ = -12f;
        CreatePickup("Pickup_AK47", pickups, new Vector3(guardX - 1f, 0.9f, guardZ), ItemData.AK47(), new Color(0.3f, 0.3f, 0.3f));
        CreatePickup("Pickup_CellKey", pickups, new Vector3(guardX + 1f, 0.9f, guardZ + 1f), ItemData.CellKey(), new Color(0.8f, 0.7f, 0.2f));
        CreatePickup("Pickup_Taser", pickups, new Vector3(guardX, 0.9f, guardZ - 1f), ItemData.Taser(), new Color(0.9f, 0.9f, 0.2f));

        // Yard items
        float yardZ = 26f;
        CreatePickup("Pickup_Shotgun", pickups, new Vector3(3f, 0.7f, yardZ), ItemData.Shotgun(), new Color(0.4f, 0.3f, 0.2f));
        CreatePickup("Pickup_Money1", pickups, new Vector3(-2f, 0.7f, yardZ + 3f), ItemData.Money(100), new Color(0.2f, 0.7f, 0.3f));
        CreatePickup("Pickup_Medkit2", pickups, new Vector3(5f, 0.7f, yardZ - 2f), ItemData.Medkit(), new Color(0.9f, 0.2f, 0.2f));

        // Cell items
        CreatePickup("Pickup_Shiv", pickups, new Vector3(-4f, 0.5f, -12f), ItemData.Shiv(), new Color(0.6f, 0.6f, 0.6f));
        CreatePickup("Pickup_Money2", pickups, new Vector3(4f, 0.5f, 0f), ItemData.Money(50), new Color(0.2f, 0.7f, 0.3f));

        EditorUtility.DisplayDialog(
            "JailBreak - Step 4 Complete",
            "Inventory system created!\n\n" +
            "- 4 hotbar slots (bottom of screen)\n" +
            "- 8 inventory slots\n" +
            "- Pickup items placed on map\n\n" +
            "Controls:\n" +
            "Tab - Open/close inventory\n" +
            "E - Pick up items (when near)\n" +
            "Click slots to move items\n\n" +
            "Press PLAY to test!",
            "OK"
        );
    }

    private static void CreatePickup(string name, GameObject parent, Vector3 position, ItemData item, Color color)
    {
        GameObject pickup = GameObject.CreatePrimitive(PrimitiveType.Cube);
        pickup.name = name;
        pickup.transform.SetParent(parent.transform);
        pickup.transform.position = position;
        pickup.transform.localScale = new Vector3(0.4f, 0.4f, 0.4f);
        pickup.GetComponent<Renderer>().material = CreateMat(color);

        // Add pickup script
        PickupItem pi = pickup.AddComponent<PickupItem>();
        pi.itemData = item;
    }

    // ============================================================
    // HELPERS
    // ============================================================
    private static void BuildCell(string name, GameObject parent, Vector3 center, float width, float depth, float height, Material wallMat, Material floorMat, Material ceilMat, Material barsMat, Material frameMat, Material bedMat, Material mattressMat, Material toiletMat, bool isLeft)
    {
        GameObject cell = new GameObject(name);
        cell.transform.SetParent(parent.transform);
        cell.transform.localPosition = center;

        // Floor & ceiling
        CreateBoxLocal("Floor", cell, new Vector3(0, 0, 0), new Vector3(depth, 0.2f, width), floorMat);
        CreateBoxLocal("Ceiling", cell, new Vector3(0, height, 0), new Vector3(depth, 0.2f, width), ceilMat);

        // Back wall
        float backX = isLeft ? -depth / 2 + 0.2f : depth / 2 - 0.2f;
        CreateBoxLocal("BackWall", cell, new Vector3(backX, height / 2, 0), new Vector3(0.4f, height, width), wallMat);

        // Bars
        float frontX = isLeft ? depth / 2 : -depth / 2;
        int barCount = 6;
        float barSpacing = width / (barCount + 1);
        for (int b = 0; b < barCount; b++)
        {
            float barZ = -width / 2 + barSpacing * (b + 1);
            GameObject bar = GameObject.CreatePrimitive(PrimitiveType.Cylinder);
            bar.name = "Bar" + b;
            bar.transform.SetParent(cell.transform);
            bar.transform.localPosition = new Vector3(frontX, height / 2, barZ);
            bar.transform.localScale = new Vector3(0.08f, height / 2, 0.08f);
            bar.GetComponent<Renderer>().material = barsMat;
        }

        // Bar frames
        CreateBoxLocal("TopFrame", cell, new Vector3(frontX, height - 0.1f, 0), new Vector3(0.15f, 0.2f, width), frameMat);
        CreateBoxLocal("BottomFrame", cell, new Vector3(frontX, 0.1f, 0), new Vector3(0.15f, 0.2f, width), frameMat);

        // Bed
        float bedX = isLeft ? -depth / 4 : depth / 4;
        float bedZ = -width / 2 + 1f;
        CreateBoxLocal("BedFrame", cell, new Vector3(bedX, 0.3f, bedZ), new Vector3(1.8f, 0.15f, 0.9f), bedMat);
        CreateBoxLocal("Mattress", cell, new Vector3(bedX, 0.42f, bedZ), new Vector3(1.7f, 0.1f, 0.8f), mattressMat);

        // Toilet
        float toiletX = isLeft ? -depth / 4 : depth / 4;
        float toiletZ = width / 2 - 0.8f;
        CreateBoxLocal("ToiletBase", cell, new Vector3(toiletX, 0.25f, toiletZ), new Vector3(0.5f, 0.5f, 0.4f), toiletMat);
    }

    private static Material CreateMat(Color color)
    {
        Material mat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
        mat.color = color;
        return mat;
    }

    private static void CreateBox(string name, GameObject parent, Vector3 position, Vector3 scale, Material mat)
    {
        GameObject box = GameObject.CreatePrimitive(PrimitiveType.Cube);
        box.name = name;
        box.transform.SetParent(parent.transform);
        box.transform.position = position;
        box.transform.localScale = scale;
        box.GetComponent<Renderer>().material = mat;
    }

    private static void CreateBoxLocal(string name, GameObject parent, Vector3 localPos, Vector3 scale, Material mat)
    {
        GameObject box = GameObject.CreatePrimitive(PrimitiveType.Cube);
        box.name = name;
        box.transform.SetParent(parent.transform);
        box.transform.localPosition = localPos;
        box.transform.localScale = scale;
        box.GetComponent<Renderer>().material = mat;
    }

    private static void CreateColoredBox(string name, Vector3 position, Color color)
    {
        DestroyIfExists(name);
        GameObject box = GameObject.CreatePrimitive(PrimitiveType.Cube);
        box.name = name;
        box.transform.position = position;
        box.transform.localScale = new Vector3(2f, 2f, 2f);
        box.GetComponent<Renderer>().material = CreateMat(color);
    }

    private static void CreateLight(string name, GameObject parent, Vector3 position, Color color, float range)
    {
        GameObject lightObj = new GameObject(name);
        lightObj.transform.SetParent(parent.transform);
        lightObj.transform.position = position;
        Light light = lightObj.AddComponent<Light>();
        light.type = LightType.Point;
        light.color = color;
        light.range = range;
        light.intensity = 2f;
        light.shadows = LightShadows.Soft;
    }

    private static void DestroyIfExists(string name)
    {
        GameObject obj = GameObject.Find(name);
        if (obj != null) DestroyImmediate(obj);
    }
}
