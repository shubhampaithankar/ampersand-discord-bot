import {
  type ChatInputCommandInteraction,
  type GuildMember,
  SlashCommandBuilder,
  type SlashCommandSubcommandBuilder,
} from "discord.js";
import { MainInteraction } from "../../classes";
import Client from "../../client";
import { CounterService } from "../../models/counter";
import { canActOnCounter, describeActor } from "../../services/discord/counter.access";
import { botAuthor, errorEmbed, infoEmbed } from "../../services/discord/embed.builder";
import { getError } from "../../services/general.utils";

const LIST_PAGE_SIZE = 25;

const addNameOption = (sub: SlashCommandSubcommandBuilder) =>
  sub.addStringOption((o) => o.setName("name").setDescription("Counter name").setRequired(true));

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

    const mutator =
      op === "inc" ? CounterService.incrementCounter : CounterService.decrementCounter;
    const updated = await mutator(interaction.guildId!, name);
    if (!updated) {
      await this.replyError({ interaction, title: "Update failed" });
      return;
    }

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

    const shown = counters.slice(0, LIST_PAGE_SIZE);
    const lines = shown.map((c) => `• \`${c.name}\` — **${c.value}** · ${describeActor(c.actor)}`);
    const description =
      counters.length > LIST_PAGE_SIZE
        ? `${lines.join("\n")}\n\n…and ${counters.length - LIST_PAGE_SIZE} more.`
        : lines.join("\n");

    await interaction.editReply({
      embeds: [
        infoEmbed({
          author: botAuthor(this.client),
          title: `Counters (${counters.length})`,
          description,
          timestamp: true,
        }),
      ],
    });
  }
}
