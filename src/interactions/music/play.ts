import { ChatInputCommandInteraction, SlashCommandBuilder } from "discord.js";
import { Response } from "poru";
import { MainInteraction } from "../../classes";
import Client from "../../client";

export default class PlayInteraction extends MainInteraction {
  constructor(client: Client) {
    super(client, {
      type: 1,
      category: "Music",
      data: new SlashCommandBuilder()
        .setName("play")
        .setDescription("plays music in user's voice channel")
        .addStringOption((option) =>
          option
            .setName("song")
            .setDescription("plays the song by name or url")
            .setRequired(true),
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
        await interaction.editReply("You need to join a voice channel");
        return;
      }

      const player = await this.client.utils.getMusicPlayer(
        guild.id,
        channel.id,
        interaction.channelId,
        true,
      );
      if (!player) {
        await interaction.editReply(
          "There was an error while creating a player",
        );
        return;
      }

      if (channel.id !== player.voiceChannel) {
        await interaction.editReply("You're not in the same voice channel");
        return;
      }

      // Connect first to maximise the window for voice handshake before resolve
      if (!player.isConnected) player.connect();

      const search = interaction.options.getString("song") || "";
      if (!search.length) {
        await interaction.editReply("Please enter a search term or URL");
        return;
      }

      let res: Response | undefined;

      try {
        res = await player.resolve({
          query: search,
          requester: member.user.username,
        });
        if (res.loadType === "error") {
          if (!player.currentTrack) player.destroy();
          console.log(res);
          // throw new Error("There was an error while resolving tracks");
        }
      } catch (err) {
        console.log(err);
        await interaction.editReply("There was an error while searching");
        return;
      }

      if (!res) {
        await interaction.editReply(
          `No results found for the term: **${search}**`,
        );
        return;
      }

      switch (res.loadType) {
        case "empty": {
          if (!player.currentTrack) player.destroy();
          await interaction.editReply(
            `No results found for the term: **${search}**`,
          );
          return;
        }
        case "track": {
          player.queue.add(res.tracks[0]);
          await interaction.editReply(
            `Added \`${res.tracks[0].info.title}\` to the queue`,
          );
          if (!player.isPlaying) await player.play();
          return;
        }
        case "playlist": {
          for (const track of res.tracks) player.queue.add(track);
          await interaction.editReply(
            `Queued playlist \`${res.playlistInfo.name}\` with ${res.tracks.length} tracks`,
          );
          if (!player.isPlaying) await player.play();
          return;
        }
        case "search": {
          player.queue.add(res.tracks[0]);
          await interaction.editReply(
            `Added \`${res.tracks[0].info.title}\` to the queue`,
          );
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
