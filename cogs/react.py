import discord 
from discord.ext import commands,tasks
from discord.utils import get 




class React(commands.Cog):
    def __init__(self,bot):
        self.sys = bot 
        self.union = self.sys.get_guild(int('1085209458633887885'))
        self.channel = 1 

    @commands.Cog.listener()
    async def on_ready(self):
        print('## COG: Реакции.')
    
    async def cog_unload(self):
        print("## COG: Отключение...")

    @commands.command()
    @commands.is_owner()
    async def set_channel(self,ctx):
            print('## COG: Смена канала.')
            self.channel = ctx.message.content.split()[1]
    
    @commands.command()
    @commands.is_owner()
    async def print_channel(self,ctx):
        print(self.channel)    
    
    @commands.command()
    @commands.is_owner()
    async def test_grt_msg(self,ctx):
            target_channel = get(self.union.text_channels,id=int(self.channel))
            embed = discord.Embed(title=f'## Авторизация',color=0xff0000)
            embed.add_field(name=f'''
Проект «Красный Рассвет» готов к защите своих интересов от внешних угроз. Нам нужны сотрудники КГБ и милиции, обученные граждане, новые каналы и научные центры. 
Мы должны быть лидерами в мире Дискорда. 
Участвуйте в укреплении нашей безопасности!
            ''',value= '\u200b')
            embed.set_footer(text='Ген.сек. ЦК КПСС Юрьевич Назар')
            embed.set_image(url='https://cdn.discordapp.com/attachments/533392531493355569/1086407593435602994/dahevi44__Create_a_digital_artwork_that_combines_elements_of_US_04683c5e-19ea-410c-81df-846433c687aa.png')
            moji = await target_channel.send(embed=embed)
            await moji.add_reaction('☑️')



async def setup(bot):
  await bot.add_cog(React(bot))