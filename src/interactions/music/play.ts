import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Response } from "poru";
import { MainInteraction } from "../../classes";
import Client from "../../client";
import { getMusicPlayer } from "../../services/discord/guild.player";
import { botAuthor, errorEmbed, musicEmbed } from "../../services/discord/embed.builder";

export default class PlayInteraction extends MainInteraction {
  constructor(client: Client) {
    super(client, {
      type: 1,
      category: "Music",
      data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("plays music in user's voice channel")
        .addStringOption((option) =>
          option.setName("song").setDescription("plays the song by name or url").setRequired(true),
        ),
    });
  }

  run = async (interaction: ChatInputCommandInteraction) => {
    await interaction.deferReply();

    try {
      const guild = this.client.guilds.cache.get(interaction.guildId!);
      if (!guild) return;

      const member = guild.members.cache.get(interaction.member!.user.id);
      if (!member) return;

      const { channel } = member.voice;
      if (!channel) {
        await interaction.editReply({
          embeds: [
            errorEmbed({
              author: botAuthor(this.client),
              description: "You need to join a voice channel",
              footer: member.user.username,
            }),
          ],
        });
        return;
      }

      const player = getMusicPlayer({
        client: this.client,
        guildId: guild.id,
        voiceChannel: channel.id,
        textChannel: interaction.channelId,
        create: true,
      });
      if (!player) {
        await interaction.editReply({
          embeds: [
            errorEmbed({
              author: botAuthor(this.client),
              description: "There was an error while creating a player",
              footer: member.user.username,
            }),
          ],
        });
        return;
      }

      if (channel.id !== player.voiceChannel) {
        await interaction.editReply({
          embeds: [
            errorEmbed({
              author: botAuthor(this.client),
              description: "You're not in the same voice channel",
              footer: member.user.username,
            }),
          ],
        });
        return;
      }

      // Connect first to maximise the window for voice handshake before resolve
      if (!player.isConnected) player.connect();

      const search = interaction.options.getString("song") || "";
      if (!search.length) {
        await interaction.editReply({
          embeds: [
            errorEmbed({
              author: botAuthor(this.client),
              description: "Please enter a search term or URL",
              footer: member.user.username,
            }),
          ],
        });
        return;
      }

      let res: Response | undefined;

      try {
        res = await player.resolve({
          query: search,
          requester: member.user.username,
        });
      } catch (err) {
        console.log(err);
        await interaction.editReply({
          embeds: [
            errorEmbed({
              author: botAuthor(this.client),
              description: "There was an error while searching",
              footer: member.user.username,
            }),
          ],
        });
        return;
      }

      if (!res) {
        await interaction.editReply({
          embeds: [
            errorEmbed({
              author: botAuthor(this.client),
              description: `No results found for **${search}**`,
              footer: member.user.username,
            }),
          ],
        });
        return;
      }

      switch (res.loadType) {
        case "error": {
          if (!player.currentTrack) player.destroy();
          await interaction.editReply({
            embeds: [
              errorEmbed({
                author: botAuthor(this.client),
                description: `Failed to load **${search}**`,
                footer: member.user.username,
              }),
            ],
          });
          return;
        }
        case "empty": {
          if (!player.currentTrack) player.destroy();
          await interaction.editReply({
            embeds: [
              errorEmbed({
                author: botAuthor(this.client),
                description: `No results found for **${search}**`,
                footer: member.user.username,
              }),
            ],
          });
          return;
        }
        case "track": {
          player.queue.add(res.tracks[0]);
          await interaction.editReply({
            embeds: [
              musicEmbed({
                author: botAuthor(this.client),
                description: `🎵 Added **[${res.tracks[0].info.title}](${res.tracks[0].info.uri || ""})** to the queue`,
                footer: member.user.username,
                thumbnail: res.tracks[0].info.artworkUrl || undefined,
              }),
            ],
          });
          if (!player.isPlaying) await player.play();
          return;
        }
        case "playlist": {
          for (const track of res.tracks) player.queue.add(track);
          await interaction.editReply({
            embeds: [
              musicEmbed({
                author: botAuthor(this.client),
                description: `🎶 Queued playlist **${res.playlistInfo.name}** — ${res.tracks.length} tracks`,
                footer: member.user.username,
              }),
            ],
          });
          if (!player.isPlaying) await player.play();
          return;
        }
        case "search": {
          player.queue.add(res.tracks[0]);
          await interaction.editReply({
            embeds: [
              musicEmbed({
                author: botAuthor(this.client),
                description: `🎵 Added **[${res.tracks[0].info.title}](${res.tracks[0].info.uri || ""})** to the queue`,
                footer: member.user.username,
                thumbnail: res.tracks[0].info.artworkUrl || undefined,
              }),
            ],
          });
          if (!player.isPlaying) await player.play();
          return;
        }
      }
    } catch (error: any) {
      console.log("There was an error in Play command: ", error);
      await interaction.editReply(`There was an error \`${error.message}\``);
    }
  };
}
