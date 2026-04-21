import {
  ButtonStyle,
  ChannelSelectMenuInteraction,
  ChannelType,
  ChatInputCommandInteraction,
  ComponentType,
  RoleSelectMenuInteraction,
  SlashCommandBuilder,
  StringSelectMenuInteraction,
  TextChannel,
  UserSelectMenuInteraction,
  VoiceChannel,
} from "discord.js";
import { MainInteraction } from "@/classes";
import Client from "@/client";
import {
  COUNTER_MODAL_INPUTS,
  COUNTER_PANEL_ACTIONS,
  type CounterActor,
  type CounterActorType,
  CounterService,
} from "@/models/counter";
import {
  AUTOGAMBLE_PANEL_ACTIONS,
  AutoGambleService,
  JTC_PANEL_ACTIONS,
  JTCService,
  MUSIC_PANEL_ACTIONS,
  MusicService,
} from "@/models/guild";
import { buildButton, buildRow, toggleButton } from "@/services/discord/button.builder";
import { describeActor } from "@/services/discord/counter.access";
import { botAuthor, errorEmbed, infoEmbed } from "@/services/discord/embed.builder";
import {
  buildCustomIds,
  createButtonHandler,
  createChainedCollector,
} from "@/services/discord/interaction.collector";
import { buildModal } from "@/services/discord/modal.builder";
import {
  buildChannelSelectRow,
  buildRoleSelectRow,
  buildStringSelectRow,
  buildUserSelectRow,
} from "@/services/discord/select.builder";

type ModuleKey = "music" | "jtc" | "autogamble" | "counter";

const COUNTER_NAME_PATTERN = /^[a-z0-9_-]{1,32}$/i;

const ACTOR_TYPE_OPTIONS = [
  { label: "Everyone", value: "everyone" },
  { label: "Specific role", value: "role" },
  { label: "Specific user", value: "user" },
  { label: "Admins (ManageGuild)", value: "admin" },
];

export default class InitInteraction extends MainInteraction {
  constructor(client: Client) {
    super(client, {
      type: 1,
      permissions: ["ManageGuild"],
      category: "Modules",
      data: new SlashCommandBuilder()
        .setName("init")
        .setDescription("Configure a server module")
        .addStringOption((o) =>
          o
            .setName("module")
            .setDescription("Module to configure")
            .setRequired(true)
            .addChoices(
              { name: "Music", value: "music" },
              { name: "Join To Create", value: "jtc" },
              { name: "Auto Gamble", value: "autogamble" },
              { name: "Counter", value: "counter" },
            ),
        ),
    });
  }

  run = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply().catch(() => {});
    try {
      const module = interaction.options.getString("module", true) as ModuleKey;
      if (module === "music") return await this.handleMusic(interaction);
      if (module === "jtc") return await this.handleJTC(interaction);
      if (module === "counter") return await this.handleCounter(interaction);
      return await this.handleAutoGamble(interaction);
    } catch (error: any) {
      console.log("There was an error in Init command: ", error);
      await interaction.editReply(`There was an error \`${error.message}\``);
    }
  };

  // ─── Music ───────────────────────────────────────────────────────────────

  handleMusic = async (interaction: ChatInputCommandInteraction) => {
    const guildId = interaction.guildId!;
    const ids = buildCustomIds({
      interaction,
      actions: MUSIC_PANEL_ACTIONS,
    });

    const fetchData = () => MusicService.getMusic(guildId);

    const buildPanel = async () => {
      const data = await fetchData();
      const music = data?.music as any;
      const enabled: boolean = music?.enabled ?? false;
      const channelIds: string[] = music?.channelIds ?? [];
      const channelMentions =
        channelIds
          .map((id) => interaction.guild!.channels.cache.get(id))
          .filter(Boolean)
          .map((ch) => `<#${ch!.id}>`)
          .join(", ") || "None configured";

      const embed = infoEmbed({
        author: botAuthor(this.client),
        title: "🎵 Music Module",
        fields: [
          { name: "Status", value: enabled ? "✅ Enabled" : "❌ Disabled", inline: true },
          { name: "Channels", value: channelMentions, inline: true },
        ],
        footer: interaction.member!.user.username,
        timestamp: true,
      });

      const row = buildRow(
        toggleButton(enabled, ids.toggle),
        buildButton({ label: "Add Channel", style: ButtonStyle.Primary, customId: ids.addChannel }),
        buildButton({
          label: "Remove Channel",
          style: ButtonStyle.Secondary,
          customId: ids.removeChannel,
          disabled: channelIds.length === 0,
        }),
      );

      return { embed, row, enabled, channelIds };
    };

    const showPanel = async () => {
      const { embed, row } = await buildPanel();
      await interaction.editReply({ content: null, embeds: [embed], components: [row] });
    };

    await showPanel();

    createButtonHandler({
      channel: interaction.channel!,
      handlers: {
        [ids.toggle]: async (i) => {
          await i.deferUpdate();
          const data = await fetchData();
          const music = data?.music as any;
          const isEnabled = music?.enabled ?? false;
          const channelIds: string[] = music?.channelIds ?? [];

          if (isEnabled) {
            await MusicService.updateMusic(guildId, { channelIds, enabled: false });
            await interaction.editReply({
              content: "❌ **Music** module has been disabled",
              embeds: [],
              components: [],
            });
          } else if (channelIds.length > 0) {
            await MusicService.updateMusic(guildId, { channelIds, enabled: true });
            await showPanel();
          } else {
            // No channels configured — prompt to add one first
            await interaction.editReply({
              content: "No channels configured. Select a text channel to enable the music module",
              embeds: [],
              components: [
                buildChannelSelectRow({ customId: ids.selectAdd, types: [ChannelType.GuildText] }),
              ],
            });
            createChainedCollector({
              channel: interaction.channel!,
              step: {
                componentType: ComponentType.ChannelSelect,
                filter: (s) => s.customId === ids.selectAdd && s.user.id === interaction.user.id,
                time: 60_000,
                handler: async (s) => {
                  const sel = s as ChannelSelectMenuInteraction;
                  await sel.deferUpdate();
                  const ch = sel.channels.first() as TextChannel;
                  if (ch) {
                    await MusicService.updateMusic(guildId, {
                      channelIds: [ch.id],
                      enabled: true,
                    });
                  }
                  await showPanel();
                  return null;
                },
                onEnd: async (_, reason) => {
                  if (reason !== "limit") await showPanel();
                },
              },
            });
          }
        },

        [ids.addChannel]: async (i) => {
          await i.deferUpdate();
          await interaction.editReply({
            content: "Select a text channel to add to the music module",
            embeds: [],
            components: [
              buildChannelSelectRow({ customId: ids.selectAdd, types: [ChannelType.GuildText] }),
            ],
          });
          createChainedCollector({
            channel: interaction.channel!,
            step: {
              componentType: ComponentType.ChannelSelect,
              filter: (s) => s.customId === ids.selectAdd && s.user.id === interaction.user.id,
              time: 60_000,
              handler: async (s) => {
                const sel = s as ChannelSelectMenuInteraction;
                await sel.deferUpdate();
                const ch = sel.channels.first() as TextChannel;
                if (ch) await MusicService.addMusicChannel(guildId, ch.id);
                await showPanel();
                return null;
              },
              onEnd: async (_, reason) => {
                if (reason !== "limit") await showPanel();
              },
            },
          });
        },

        [ids.removeChannel]: async (i) => {
          await i.deferUpdate();
          const data = await fetchData();
          const channelIds: string[] = (data?.music as any)?.channelIds ?? [];
          if (channelIds.length === 0) {
            await showPanel();
            return;
          }
          const options = channelIds
            .map((id) => {
              const ch = interaction.guild!.channels.cache.get(id);
              return ch ? { label: `#${ch.name}`, value: id } : null;
            })
            .filter((o): o is { label: string; value: string } => o !== null);

          await interaction.editReply({
            content: "Select a channel to remove",
            embeds: [],
            components: [
              buildStringSelectRow({
                customId: ids.selectRemove,
                options,
                placeholder: "Select a channel to remove",
              }),
            ],
          });
          createChainedCollector({
            channel: interaction.channel!,
            step: {
              componentType: ComponentType.StringSelect,
              filter: (s) => s.customId === ids.selectRemove && s.user.id === interaction.user.id,
              time: 60_000,
              handler: async (s) => {
                const sel = s as StringSelectMenuInteraction;
                await sel.deferUpdate();
                await MusicService.removeMusicChannel(guildId, sel.values[0]);
                await showPanel();
                return null;
              },
              onEnd: async (_, reason) => {
                if (reason !== "limit") await showPanel();
              },
            },
          });
        },
      },
      filter: (i) =>
        [ids.toggle, ids.addChannel, ids.removeChannel].includes(i.customId) &&
        i.user.id === interaction.user.id,
      time: 1000 * 60 * 15,
      onEnd: async () => {
        const { embed } = await buildPanel();
        await interaction.editReply({ embeds: [embed], components: [] }).catch(() => {});
      },
    });
  };

  // ─── JTC ─────────────────────────────────────────────────────────────────

  handleJTC = async (interaction: ChatInputCommandInteraction) => {
    const guildId = interaction.guildId!;
    const ids = buildCustomIds({
      interaction,
      actions: JTC_PANEL_ACTIONS,
    });

    const fetchData = () => JTCService.getJTC(guildId);

    const buildPanel = async () => {
      const data = await fetchData();
      const jtc = data?.jtc as any;
      const enabled: boolean = jtc?.enabled ?? false;
      const channelId: string | undefined = jtc?.channelId;
      const channel = channelId ? interaction.guild!.channels.cache.get(channelId) : null;

      const embed = infoEmbed({
        author: botAuthor(this.client),
        title: "🔊 Join To Create Module",
        fields: [
          { name: "Status", value: enabled ? "✅ Enabled" : "❌ Disabled", inline: true },
          {
            name: "Channel",
            value: channel ? `<#${channel.id}>` : "None configured",
            inline: true,
          },
        ],
        footer: interaction.member!.user.username,
        timestamp: true,
      });

      const row = buildRow(
        toggleButton(enabled, ids.toggle),
        buildButton({ label: "Set Channel", style: ButtonStyle.Primary, customId: ids.setChannel }),
      );

      return { embed, row, enabled, channelId };
    };

    const showPanel = async () => {
      const { embed, row } = await buildPanel();
      await interaction.editReply({ content: null, embeds: [embed], components: [row] });
    };

    await showPanel();

    createButtonHandler({
      channel: interaction.channel!,
      handlers: {
        [ids.toggle]: async (i) => {
          await i.deferUpdate();
          const data = await fetchData();
          const jtc = data?.jtc as any;

          if (!jtc?.enabled) {
            if (jtc?.channelId) {
              // Channel already configured — just re-enable
              await JTCService.updateJTC(guildId, { channelId: jtc.channelId, enabled: true });
              await showPanel();
            } else {
              // No channel yet — prompt for selection
              await interaction.editReply({
                content: "Select the voice channel users should join to create a new channel",
                embeds: [],
                components: [
                  buildChannelSelectRow({
                    customId: ids.selectChannel,
                    types: [ChannelType.GuildVoice],
                  }),
                ],
              });
              createChainedCollector({
                channel: interaction.channel!,
                step: {
                  componentType: ComponentType.ChannelSelect,
                  filter: (s) =>
                    s.customId === ids.selectChannel && s.user.id === interaction.user.id,
                  time: 60_000,
                  handler: async (s) => {
                    const sel = s as ChannelSelectMenuInteraction;
                    await sel.deferUpdate();
                    const ch = sel.channels.first() as VoiceChannel;
                    if (ch) {
                      await ch.permissionOverwrites.edit(this.bot!, { ViewChannel: true });
                      await JTCService.updateJTC(guildId, { channelId: ch.id, enabled: true });
                      await interaction.editReply({
                        content: `✅ **Join To Create** enabled — \`${ch.name}\` set as the JTC channel`,
                        embeds: [],
                        components: [],
                      });
                      setTimeout(() => showPanel(), 3000);
                    }
                    return null;
                  },
                  onEnd: async () => showPanel(),
                },
              });
            }
          } else {
            // Disabling: flip the flag and close the panel
            await JTCService.updateJTC(guildId, {
              channelId: jtc.channelId,
              enabled: false,
            });
            await interaction.editReply({
              content: "❌ **Join To Create** has been disabled",
              embeds: [],
              components: [],
            });
          }
        },

        [ids.setChannel]: async (i) => {
          await i.deferUpdate();
          await interaction.editReply({
            content: "Select the voice channel users should join to create a new channel",
            embeds: [],
            components: [
              buildChannelSelectRow({
                customId: ids.selectChannel,
                types: [ChannelType.GuildVoice],
              }),
            ],
          });
          createChainedCollector({
            channel: interaction.channel!,
            step: {
              componentType: ComponentType.ChannelSelect,
              filter: (s) => s.customId === ids.selectChannel && s.user.id === interaction.user.id,
              time: 60_000,
              handler: async (s) => {
                const sel = s as ChannelSelectMenuInteraction;
                await sel.deferUpdate();
                const ch = sel.channels.first() as VoiceChannel;
                if (ch) {
                  await ch.permissionOverwrites.edit(this.bot!, { ViewChannel: true });
                  await JTCService.updateJTC(guildId, { channelId: ch.id, enabled: true });
                  await interaction.editReply({
                    content: `✅ JTC channel updated to \`${ch.name}\``,
                    embeds: [],
                    components: [],
                  });
                  setTimeout(() => showPanel(), 3000);
                }
                return null;
              },
              onEnd: async () => showPanel(),
            },
          });
        },
      },
      filter: (i) =>
        [ids.toggle, ids.setChannel].includes(i.customId) && i.user.id === interaction.user.id,
      time: 1000 * 60 * 15,
      onEnd: async () => {
        const { embed } = await buildPanel();
        await interaction.editReply({ embeds: [embed], components: [] }).catch(() => {});
      },
    });
  };

  // ─── AutoGamble ───────────────────────────────────────────────────────────

  handleAutoGamble = async (interaction: ChatInputCommandInteraction) => {
    const guildId = interaction.guildId!;
    const ids = buildCustomIds({
      interaction,
      actions: AUTOGAMBLE_PANEL_ACTIONS,
    });

    const fetchData = () => AutoGambleService.getAutoGamble(guildId);

    const buildPanel = async () => {
      const data = await fetchData();
      const ag = data?.autoGamble as any;
      const enabled: boolean = ag?.enabled ?? false;
      const channelIds: string[] = ag?.channelIds ?? [];
      const chance: number = ag?.chance ?? 10;
      const timeoutDuration: number = ag?.timeoutDuration ?? 30;
      const channelMentions =
        channelIds
          .map((id) => interaction.guild!.channels.cache.get(id))
          .filter(Boolean)
          .map((ch) => `<#${ch!.id}>`)
          .join(", ") || "None configured";

      const embed = infoEmbed({
        author: botAuthor(this.client),
        title: "🎰 Auto Gamble Module",
        fields: [
          { name: "Status", value: enabled ? "✅ Enabled" : "❌ Disabled", inline: true },
          { name: "Roll Chance", value: `${chance}%`, inline: true },
          { name: "Timeout Duration", value: `${timeoutDuration}s`, inline: true },
          { name: "Channels", value: channelMentions },
        ],
        footer: interaction.member!.user.username,
        timestamp: true,
      });

      const row1 = buildRow(
        toggleButton(enabled, ids.toggle),
        buildButton({ label: "Add Channel", style: ButtonStyle.Primary, customId: ids.addChannel }),
        buildButton({
          label: "Remove Channel",
          style: ButtonStyle.Secondary,
          customId: ids.removeChannel,
          disabled: channelIds.length === 0,
        }),
      );
      const row2 = buildRow(
        buildButton({ label: "⚙️ Settings", style: ButtonStyle.Secondary, customId: ids.settings }),
      );

      return { embed, rows: [row1, row2], enabled, channelIds };
    };

    const showPanel = async () => {
      const { embed, rows } = await buildPanel();
      await interaction.editReply({ content: null, embeds: [embed], components: rows });
    };

    await showPanel();

    createButtonHandler({
      channel: interaction.channel!,
      handlers: {
        [ids.toggle]: async (i) => {
          await i.deferUpdate();
          const data = await fetchData();
          const ag = data?.autoGamble as any;
          const isEnabled = ag?.enabled ?? false;
          const channelIds: string[] = ag?.channelIds ?? [];

          if (isEnabled) {
            await AutoGambleService.updateAutoGamble(guildId, { channelIds, enabled: false });
            await interaction.editReply({
              content: "❌ **Auto Gamble** module has been disabled",
              embeds: [],
              components: [],
            });
          } else if (channelIds.length > 0) {
            await AutoGambleService.updateAutoGamble(guildId, { channelIds, enabled: true });
            await showPanel();
          } else {
            // No channels configured — prompt to add one first
            await interaction.editReply({
              content:
                "No channels configured. Select a text channel to enable the auto gamble module",
              embeds: [],
              components: [
                buildChannelSelectRow({ customId: ids.selectAdd, types: [ChannelType.GuildText] }),
              ],
            });
            createChainedCollector({
              channel: interaction.channel!,
              step: {
                componentType: ComponentType.ChannelSelect,
                filter: (s) => s.customId === ids.selectAdd && s.user.id === interaction.user.id,
                time: 60_000,
                handler: async (s) => {
                  const sel = s as ChannelSelectMenuInteraction;
                  await sel.deferUpdate();
                  const ch = sel.channels.first() as TextChannel;
                  if (ch) {
                    await AutoGambleService.updateAutoGamble(guildId, {
                      channelIds: [ch.id],
                      enabled: true,
                    });
                  }
                  await showPanel();
                  return null;
                },
                onEnd: async (_, reason) => {
                  if (reason !== "limit") await showPanel();
                },
              },
            });
          }
        },

        [ids.addChannel]: async (i) => {
          await i.deferUpdate();
          await interaction.editReply({
            content: "Select a text channel to add to the auto gamble module",
            embeds: [],
            components: [
              buildChannelSelectRow({ customId: ids.selectAdd, types: [ChannelType.GuildText] }),
            ],
          });
          createChainedCollector({
            channel: interaction.channel!,
            step: {
              componentType: ComponentType.ChannelSelect,
              filter: (s) => s.customId === ids.selectAdd && s.user.id === interaction.user.id,
              time: 60_000,
              handler: async (s) => {
                const sel = s as ChannelSelectMenuInteraction;
                await sel.deferUpdate();
                const ch = sel.channels.first() as TextChannel;
                if (ch) await AutoGambleService.addAutoGambleChannel(guildId, ch.id);
                await showPanel();
                return null;
              },
              onEnd: async (_, reason) => {
                if (reason !== "limit") await showPanel();
              },
            },
          });
        },

        [ids.removeChannel]: async (i) => {
          await i.deferUpdate();
          const data = await fetchData();
          const channelIds: string[] = (data?.autoGamble as any)?.channelIds ?? [];
          if (channelIds.length === 0) {
            await showPanel();
            return;
          }
          const options = channelIds
            .map((id) => {
              const ch = interaction.guild!.channels.cache.get(id);
              return ch ? { label: `#${ch.name}`, value: id } : null;
            })
            .filter((o): o is { label: string; value: string } => o !== null);

          await interaction.editReply({
            content: "Select a channel to remove",
            embeds: [],
            components: [
              buildStringSelectRow({
                customId: ids.selectRemove,
                options,
                placeholder: "Select a channel to remove",
              }),
            ],
          });
          createChainedCollector({
            channel: interaction.channel!,
            step: {
              componentType: ComponentType.StringSelect,
              filter: (s) => s.customId === ids.selectRemove && s.user.id === interaction.user.id,
              time: 60_000,
              handler: async (s) => {
                const sel = s as StringSelectMenuInteraction;
                await sel.deferUpdate();
                await AutoGambleService.removeAutoGambleChannel(guildId, sel.values[0]);
                await showPanel();
                return null;
              },
              onEnd: async (_, reason) => {
                if (reason !== "limit") await showPanel();
              },
            },
          });
        },

        [ids.settings]: async (i) => {
          await i.deferUpdate();
          await interaction.editReply({
            content: "Select the roll chance (probability of timeout per message)",
            embeds: [],
            components: [
              buildStringSelectRow({
                customId: ids.selectChance,
                placeholder: "Select roll chance",
                options: [
                  { label: "5%", value: "5" },
                  { label: "10% (default)", value: "10" },
                  { label: "15%", value: "15" },
                  { label: "20%", value: "20" },
                  { label: "25%", value: "25" },
                  { label: "30%", value: "30" },
                ],
              }),
            ],
          });
          createChainedCollector({
            channel: interaction.channel!,
            step: {
              componentType: ComponentType.StringSelect,
              filter: (s) => s.customId === ids.selectChance && s.user.id === interaction.user.id,
              time: 60_000,
              handler: async (s) => {
                const sel = s as StringSelectMenuInteraction;
                await sel.deferUpdate();
                await AutoGambleService.updateAutoGamble(guildId, {
                  chance: parseInt(sel.values[0], 10),
                });
                await interaction.editReply({
                  content: "Now select the timeout duration",
                  embeds: [],
                  components: [
                    buildStringSelectRow({
                      customId: ids.selectDuration,
                      placeholder: "Select timeout duration",
                      options: [
                        { label: "15 seconds", value: "15" },
                        { label: "30 seconds (default)", value: "30" },
                        { label: "1 minute", value: "60" },
                        { label: "2 minutes", value: "120" },
                        { label: "5 minutes", value: "300" },
                        { label: "10 minutes", value: "600" },
                      ],
                    }),
                  ],
                });
                return {
                  componentType: ComponentType.StringSelect,
                  filter: (s: any) =>
                    s.customId === ids.selectDuration && s.user.id === interaction.user.id,
                  time: 60_000,
                  handler: async (s: any) => {
                    const sel2 = s as StringSelectMenuInteraction;
                    await sel2.deferUpdate();
                    await AutoGambleService.updateAutoGamble(guildId, {
                      timeoutDuration: parseInt(sel2.values[0], 10),
                    });
                    await showPanel();
                    return null;
                  },
                  onEnd: async (_: any, reason: string) => {
                    if (reason !== "limit") await showPanel();
                  },
                };
              },
              onEnd: async (_, reason) => {
                if (reason !== "limit") await showPanel();
              },
            },
          });
        },
      },
      filter: (i) =>
        [ids.toggle, ids.addChannel, ids.removeChannel, ids.settings].includes(i.customId) &&
        i.user.id === interaction.user.id,
      time: 1000 * 60 * 15,
      onEnd: async () => {
        const { embed, rows } = await buildPanel();
        await interaction.editReply({ embeds: [embed], components: rows }).catch(() => {});
      },
    });
  };

  // ─── Counter ──────────────────────────────────────────────────────────────

  handleCounter = async (interaction: ChatInputCommandInteraction) => {
    const guildId = interaction.guildId!;
    const ids = buildCustomIds({
      interaction,
      actions: COUNTER_PANEL_ACTIONS,
    });

    const fetchCounters = () => CounterService.listCounters(guildId);

    const buildPanel = async () => {
      const counters = await fetchCounters();
      const lines = counters.length
        ? counters
            .slice(0, 25)
            .map((c) => `• \`${c.name}\` — **${c.value}** · ${describeActor(c.actor)}`)
            .join("\n")
        : "_No counters yet. Click **+ New** to create one._";

      const embed = infoEmbed({
        author: botAuthor(this.client),
        title: "🔢 Counter Module",
        description: lines,
        footer: interaction.member!.user.username,
        timestamp: true,
      });

      const hasCounters = counters.length > 0;
      const row1 = buildRow(
        buildButton({ label: "+ New", style: ButtonStyle.Success, customId: ids.create }),
        buildButton({
          label: "Edit",
          style: ButtonStyle.Primary,
          customId: ids.edit,
          disabled: !hasCounters,
        }),
        buildButton({
          label: "Delete",
          style: ButtonStyle.Danger,
          customId: ids.delete,
          disabled: !hasCounters,
        }),
      );
      const row2 = buildRow(
        buildButton({
          label: "Reset",
          style: ButtonStyle.Secondary,
          customId: ids.reset,
          disabled: !hasCounters,
        }),
        buildButton({
          label: "Set Value",
          style: ButtonStyle.Secondary,
          customId: ids.setValue,
          disabled: !hasCounters,
        }),
      );

      return { embed, rows: [row1, row2], counters };
    };

    const showPanel = async () => {
      const { embed, rows } = await buildPanel();
      await interaction.editReply({ content: null, embeds: [embed], components: rows });
    };

    const showError = async (title: string, description: string) => {
      await interaction.editReply({
        content: null,
        embeds: [
          errorEmbed({
            author: botAuthor(this.client),
            title,
            description,
            timestamp: true,
          }),
        ],
        components: [],
      });
      setTimeout(() => showPanel(), 3000);
    };

    const promptActorFlow = async (
      name: string,
      onActor: (actor: CounterActor) => Promise<void>,
    ) => {
      await interaction.editReply({
        content: `Pick who can modify \`${name}\``,
        embeds: [],
        components: [
          buildStringSelectRow({
            customId: ids.selectActorType,
            options: ACTOR_TYPE_OPTIONS,
            placeholder: "Select actor type",
          }),
        ],
      });

      createChainedCollector({
        channel: interaction.channel!,
        step: {
          componentType: ComponentType.StringSelect,
          filter: (s) => s.customId === ids.selectActorType && s.user.id === interaction.user.id,
          time: 60_000,
          handler: async (s) => {
            const sel = s as StringSelectMenuInteraction;
            await sel.deferUpdate();
            const type = sel.values[0] as CounterActorType;

            if (type === "everyone" || type === "admin") {
              await onActor({ type });
              return null;
            }

            if (type === "role") {
              await interaction.editReply({
                content: `Pick the role allowed to modify \`${name}\``,
                components: [
                  buildRoleSelectRow({ customId: ids.selectRole, placeholder: "Select a role" }),
                ],
              });
              return {
                componentType: ComponentType.RoleSelect,
                filter: (r: any) =>
                  r.customId === ids.selectRole && r.user.id === interaction.user.id,
                time: 60_000,
                handler: async (r: any) => {
                  const rsel = r as RoleSelectMenuInteraction;
                  await rsel.deferUpdate();
                  const role = rsel.roles.first();
                  if (role) await onActor({ type: "role", targetId: role.id });
                  else await showPanel();
                  return null;
                },
                onEnd: async (_: any, reason: string) => {
                  if (reason !== "limit") await showPanel();
                },
              };
            }

            await interaction.editReply({
              content: `Pick the user allowed to modify \`${name}\``,
              components: [
                buildUserSelectRow({ customId: ids.selectUser, placeholder: "Select a user" }),
              ],
            });
            return {
              componentType: ComponentType.UserSelect,
              filter: (u: any) =>
                u.customId === ids.selectUser && u.user.id === interaction.user.id,
              time: 60_000,
              handler: async (u: any) => {
                const usel = u as UserSelectMenuInteraction;
                await usel.deferUpdate();
                const user = usel.users.first();
                if (user) await onActor({ type: "user", targetId: user.id });
                else await showPanel();
                return null;
              },
              onEnd: async (_: any, reason: string) => {
                if (reason !== "limit") await showPanel();
              },
            };
          },
          onEnd: async (_, reason) => {
            if (reason !== "limit") await showPanel();
          },
        },
      });
    };

    const promptCounterSelect = async (
      counters: { name: string; value: number }[],
      placeholder: string,
      onPick: (name: string) => Promise<void>,
    ) => {
      const options = counters
        .slice(0, 25)
        .map((c) => ({ label: c.name, value: c.name, description: `Current: ${c.value}` }));

      await interaction.editReply({
        content: null,
        embeds: [],
        components: [buildStringSelectRow({ customId: ids.selectCounter, options, placeholder })],
      });

      createChainedCollector({
        channel: interaction.channel!,
        step: {
          componentType: ComponentType.StringSelect,
          filter: (s) => s.customId === ids.selectCounter && s.user.id === interaction.user.id,
          time: 60_000,
          handler: async (s) => {
            const sel = s as StringSelectMenuInteraction;
            await sel.deferUpdate();
            await onPick(sel.values[0]);
            return null;
          },
          onEnd: async (_, reason) => {
            if (reason !== "limit") await showPanel();
          },
        },
      });
    };

    await showPanel();

    createButtonHandler({
      channel: interaction.channel!,
      handlers: {
        [ids.create]: async (i) => {
          const modal = buildModal({
            customId: ids.nameModal,
            title: "New Counter",
            inputs: [
              {
                customId: COUNTER_MODAL_INPUTS.NAME,
                label: "Counter name (a-z, 0-9, _-)",
                required: true,
                minLength: 1,
                maxLength: 32,
              },
            ],
          });
          await i.showModal(modal);
          const submit = await i
            .awaitModalSubmit({
              filter: (s) => s.customId === ids.nameModal && s.user.id === interaction.user.id,
              time: 60_000,
            })
            .catch(() => null);
          if (!submit) return;
          await submit.deferUpdate();

          const name = submit.fields.getTextInputValue(COUNTER_MODAL_INPUTS.NAME).trim();
          if (!COUNTER_NAME_PATTERN.test(name)) {
            await showError("Invalid name", "Use 1–32 chars from `a–z`, `0–9`, `_`, `-`.");
            return;
          }

          const existing = await CounterService.getCounter(guildId, name);
          if (existing) {
            await showError(
              "Already exists",
              `A counter named \`${name.toLowerCase()}\` already exists.`,
            );
            return;
          }

          await promptActorFlow(name, async (actor) => {
            try {
              await CounterService.createCounter({
                guildId,
                name,
                actor,
                createdBy: interaction.user.id,
              });
            } catch (error: any) {
              if (error?.code === 11000) {
                await showError(
                  "Already exists",
                  `A counter named \`${name.toLowerCase()}\` already exists.`,
                );
                return;
              }
              throw error;
            }
            await showPanel();
          });
        },

        [ids.edit]: async (i) => {
          await i.deferUpdate();
          const counters = await fetchCounters();
          if (!counters.length) return showPanel();

          await promptCounterSelect(counters, "Pick a counter to edit", async (name) => {
            await promptActorFlow(name, async (actor) => {
              await CounterService.updateCounter(guildId, name, { actor });
              await showPanel();
            });
          });
        },

        [ids.delete]: async (i) => {
          await i.deferUpdate();
          const counters = await fetchCounters();
          if (!counters.length) return showPanel();

          await promptCounterSelect(counters, "Pick a counter to delete", async (name) => {
            await CounterService.deleteCounter(guildId, name);
            await showPanel();
          });
        },

        [ids.reset]: async (i) => {
          await i.deferUpdate();
          const counters = await fetchCounters();
          if (!counters.length) return showPanel();

          await promptCounterSelect(counters, "Pick a counter to reset to 0", async (name) => {
            await CounterService.updateCounter(guildId, name, { value: 0 });
            await showPanel();
          });
        },

        [ids.setValue]: async (i) => {
          await i.deferUpdate();
          const counters = await fetchCounters();
          if (!counters.length) return showPanel();

          await promptCounterSelect(counters, "Pick a counter to set value", async (name) => {
            // Use the StringSelect's button interaction to show modal — but at
            // this point we only have deferUpdate'd. Fall back to a secondary
            // button click: prompt user to click a "Submit value" button that
            // shows the modal. Simpler path: chain an extra button step.
            const openIds = buildCustomIds({
              interaction,
              actions: { OPEN_VALUE_MODAL: COUNTER_PANEL_ACTIONS.OPEN_VALUE_MODAL },
            });
            await interaction.editReply({
              content: `Click below to set the value for \`${name}\``,
              embeds: [],
              components: [
                buildRow(
                  buildButton({
                    label: "Enter value",
                    style: ButtonStyle.Primary,
                    customId: openIds.openValueModal,
                  }),
                ),
              ],
            });
            createChainedCollector({
              channel: interaction.channel!,
              step: {
                componentType: ComponentType.Button,
                filter: (b) =>
                  b.customId === openIds.openValueModal && b.user.id === interaction.user.id,
                time: 60_000,
                handler: async (b) => {
                  const btn = b as any;
                  const modal = buildModal({
                    customId: ids.valueModal,
                    title: `Set ${name}`,
                    inputs: [
                      {
                        customId: COUNTER_MODAL_INPUTS.VALUE,
                        label: "New value (integer)",
                        required: true,
                        maxLength: 11,
                      },
                    ],
                  });
                  await btn.showModal(modal);
                  const submit = await btn
                    .awaitModalSubmit({
                      filter: (s: any) =>
                        s.customId === ids.valueModal && s.user.id === interaction.user.id,
                      time: 60_000,
                    })
                    .catch(() => null);
                  if (!submit) {
                    await showPanel();
                    return null;
                  }
                  await submit.deferUpdate();
                  const raw = submit.fields.getTextInputValue(COUNTER_MODAL_INPUTS.VALUE).trim();
                  const parsed = Number(raw);
                  if (!Number.isInteger(parsed) || Math.abs(parsed) > 1_000_000) {
                    await showError(
                      "Invalid value",
                      "Enter an integer in [-1,000,000, 1,000,000].",
                    );
                    return null;
                  }
                  await CounterService.updateCounter(guildId, name, { value: parsed });
                  await showPanel();
                  return null;
                },
                onEnd: async (_, reason) => {
                  if (reason !== "limit") await showPanel();
                },
              },
            });
          });
        },
      },
      filter: (i) =>
        [ids.create, ids.edit, ids.delete, ids.reset, ids.setValue].includes(i.customId) &&
        i.user.id === interaction.user.id,
      time: 1000 * 60 * 15,
      onEnd: async () => {
        const { embed } = await buildPanel();
        await interaction.editReply({ embeds: [embed], components: [] }).catch(() => {});
      },
    });
  };
}
