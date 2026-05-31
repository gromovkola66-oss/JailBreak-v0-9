using UnityEngine;

public static class BotSpawner
{
    public static GameObject SpawnBot(Vector3 position, Team team, Vector3[] waypoints)
    {
        GameObject bot = GameObject.CreatePrimitive(PrimitiveType.Capsule);
        bot.name = team.ToString() + "Bot_" + Random.Range(1000, 9999);
        bot.transform.position = position;

        Object.Destroy(bot.GetComponent<CapsuleCollider>());

        CharacterController cc = bot.AddComponent<CharacterController>();
        cc.height = 2f;
        cc.radius = 0.4f;
        cc.center = new Vector3(0f, 1f, 0f);

        BotController bc = bot.AddComponent<BotController>();
        bc.team = team;
        bc.waypoints = waypoints;

        BotHealth bh = bot.AddComponent<BotHealth>();

        DamageReceiver dr = bot.AddComponent<DamageReceiver>();
        dr.team = team;

        Renderer rend = bot.GetComponent<Renderer>();
        if (rend != null)
        {
            Material mat = new Material(Shader.Find("Universal Render Pipeline/Lit"));
            if (team == Team.Guard)
                mat.color = new Color(0.2f, 0.4f, 0.8f);
            else
                mat.color = new Color(0.9f, 0.5f, 0.1f);
            rend.material = mat;
        }

        if (TeamManager.Instance != null)
        {
            TeamManager.Instance.AssignTeam(bot, team);
        }

        return bot;
    }
}
