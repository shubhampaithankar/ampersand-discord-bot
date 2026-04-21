import {
  type AutocompleteInteraction,
  ButtonStyle,
  type ChatInputCommandInteraction,
  type GuildMember,
  SlashCommandBuilder,
  type SlashCommandSubcommandBuilder,
} from "discord.js";
import { MainInteraction } from "@/classes";
import Client from "@/client";
import { CounterService } from "@/models/counter";
import { buildButton, buildRow } from "@/services/discord/button.builder";
import { canActOnCounter, describeActor } from "@/services/discord/counter.access";
import { botAuthor, errorEmbed, infoEmbed } from "@/services/discord/embed.builder";
import { buildCustomIds, createPaginator } from "@/services/discord/interaction.collector";
import { getError } from "@/services/general.utils";
import { getRemainingCooldown, setCooldown } from "@/services/redis/cooldown.redis";

const LIST_PAGE_SIZE = 25;
const COUNTER_COOLDOWN_SECONDS = 3;

const counterCooldownKey = (name: string) => `counter:${name.toLowerCase()}`;

const addNameOption = (sub: SlashCommandSubcommandBuilder) =>
  sub.addStringOption((o) =>
    o.setName("name").setDescription("Counter name").setRequired(true).setAutocomplete(true),
  );

export default class CounterInteraction extends MainInteraction {
  constructor(client: Client) {
    super(client, {
      type: 1,
      data: new SlashCommandBuilder()
        .setName("counter")
        .setDescription("Increment, decrement, or view counters")
        .addSubcommand((sub) =>
          addNameOption(sub.setName("inc").setDescription("Increment a counter by 1")),
        )
        .addSubcommand((sub) =>
          addNameOption(sub.setName("dec").setDescription("Decrement a counter by 1")),
        )
        .addSubcommand((sub) =>
          addNameOption(sub.setName("view").setDescription("View a counter's current value")),
        )
        .addSubcommand((sub) =>
          sub.setName("list").setDescription("List all counters in this server"),
        ),
    });
  }

  run = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();
    try {
      const sub = interaction.options.getSubcommand(true);

      switch (sub) {
        case "inc":
        case "dec":
          await this.handleMutate(interaction, sub);
          break;
        case "view":
          await this.handleView(interaction);
          break;
        case "list":
          await this.handleList(interaction);
          break;
        default:
          await interaction.editReply({
            embeds: [errorEmbed({ title: "Unknown subcommand", description: `\`${sub}\`` })],
          });
      }
    } catch (error) {
      console.log("There was an error in Counter command: ", error);
      await interaction.editReply(`There was an error \`${getError(error)}\``);
    }
  };

  autocomplete = async (interaction: AutocompleteInteraction) => {
    try {
      if (!interaction.guildId) {
        await interaction.respond([]);
        return;
      }
      const focused = interaction.options.getFocused();
      const results = await CounterService.searchCountersByPrefix(interaction.guildId, focused, 25);
      await interaction.respond(
        results.map((c) => ({ name: `${c.name} (${c.value})`, value: c.name })),
      );
    } catch {
      await interaction.respond([]).catch(() => {});
    }
  };

  private replyError({
    interaction,
    title,
    description = "",
  }: {
    interaction: ChatInputCommandInteraction;
    title: string;
    description?: string;
  }) {
    return interaction.editReply({
      embeds: [
        errorEmbed({
          author: botAuthor(this.client),
          title,
          description,
          footer: interaction.member?.user.username ?? undefined,
          timestamp: true,
        }),
      ],
    });
  }

  private async handleMutate(interaction: ChatInputCommandInteraction, op: "inc" | "dec") {
    const name = interaction.options.getString("name", true);
    const counter = await CounterService.getCounter(interaction.guildId!, name);
    if (!counter) {
      await this.replyError({
        interaction,
        title: "Counter not found",
        description: `\`${name}\``,
      });
      return;
    }

    const member = interaction.member as GuildMember;
    if (!canActOnCounter({ member, actor: counter.actor })) {
      await this.replyError({
        interaction,
        title: "Not allowed",
        description: `You can't modify \`${counter.name}\`. **Can act:** ${describeActor(counter.actor)}`,
      });
      return;
    }

    const cooldownKey = counterCooldownKey(counter.name);
    const remaining = await getRemainingCooldown(cooldownKey, member.id);
    if (remaining > 0) {
      await this.replyError({
        interaction,
        title: "Slow down",
        description: `Wait ${(remaining / 1000).toFixed(1)}s before touching \`${counter.name}\` again.`,
      });
      return;
    }

    const mutator =
      op === "inc" ? CounterService.incrementCounter : CounterService.decrementCounter;
    const updated = await mutator(interaction.guildId!, name);
    if (!updated) {
      await this.replyError({ interaction, title: "Update failed" });
      return;
    }

    await setCooldown({
      commandName: cooldownKey,
      userId: member.id,
      ttlSeconds: COUNTER_COOLDOWN_SECONDS,
    });

    await interaction.editReply({
      embeds: [
        infoEmbed({
          author: botAuthor(this.client),
          title: `${updated.name} = ${updated.value}`,
          description: `${op === "inc" ? "Incremented" : "Decremented"} by <@${member.id}>`,
          timestamp: true,
        }),
      ],
    });
  }

  private async handleView(interaction: ChatInputCommandInteraction) {
    const name = interaction.options.getString("name", true);
    const counter = await CounterService.getCounter(interaction.guildId!, name);
    if (!counter) {
      await this.replyError({
        interaction,
        title: "Counter not found",
        description: `\`${name}\``,
      });
      return;
    }

    await interaction.editReply({
      embeds: [
        infoEmbed({
          author: botAuthor(this.client),
          title: `${counter.name} = ${counter.value}`,
          description: `**Can act:** ${describeActor(counter.actor)}`,
          timestamp: true,
        }),
      ],
    });
  }

  private async handleList(interaction: ChatInputCommandInteraction) {
    const counters = await CounterService.listCounters(interaction.guildId!);
    if (!counters.length) {
      await interaction.editReply({
        embeds: [
          infoEmbed({
            author: botAuthor(this.client),
            title: "No counters",
            description: "An admin can create one via `/init module:counter`.",
          }),
        ],
      });
      return;
    }

    const totalPages = Math.max(1, Math.ceil(counters.length / LIST_PAGE_SIZE));
    const pages = Array.from({ length: totalPages }, (_, i) => {
      const chunk = counters.slice(i * LIST_PAGE_SIZE, (i + 1) * LIST_PAGE_SIZE);
      const lines = chunk.map(
        (c) => `• \`${c.name}\` — **${c.value}** · ${describeActor(c.actor)}`,
      );
      return infoEmbed({
        author: botAuthor(this.client),
        title: `Counters (${counters.length}) — Page ${i + 1}/${totalPages}`,
        description: lines.join("\n"),
        timestamp: true,
      });
    });

    if (pages.length === 1) {
      await interaction.editReply({ embeds: [pages[0]] });
      return;
    }

    const ids = buildCustomIds({
      interaction,
      actions: ["prevPage", "nextPage", "cancel"] as const,
    });
    const buttonRow = buildRow(
      buildButton({ label: "Prev", style: ButtonStyle.Secondary, customId: ids.prevPage }),
      buildButton({ label: "Next", style: ButtonStyle.Primary, customId: ids.nextPage }),
      buildButton({ label: "Close", style: ButtonStyle.Danger, customId: ids.cancel }),
    );

    await interaction.editReply({ embeds: [pages[0]], components: [buttonRow] });

    createPaginator({
      interaction,
      pages,
      customIds: { prev: ids.prevPage, next: ids.nextPage, cancel: ids.cancel },
      buttonRow,
      userId: interaction.user.id,
    });
  }
}
