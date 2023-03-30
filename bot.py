import discord 
from discord.ext import commands,tasks
from discord.utils import get 
import logging


intents = discord.Intents.default()
intents.message_content = True
intents.voice_states = True
owner_id=224486385992728576
sys = commands.Bot(command_prefix=">",owner_id=owner_id,intents=intents)
 #logger

logger = logging.getLogger(__name__)
logger.setLevel(logging.DEBUG)

fh = logging.FileHandler('pt1x12.log','w','utf-8')
fh.setLevel(logging.DEBUG)

ch = logging.StreamHandler()
ch.setLevel(logging.DEBUG)

formatter = logging.Formatter('%(asctime)s - %(name)s - %(levelname)s - %(message)s')
fh.setFormatter(formatter)
ch.setFormatter(formatter)

logger.addHandler(fh)
logger.addHandler(ch)

@sys.event
async def on_ready():
    logger.info('Система PT-1X12 готова.')

@sys.command()
@commands.is_owner()
async def load(ctx,extension):
    logger.info('Пользователь %s использует load',ctx.author.id)
    #print(ctx.author.id)
    await sys.load_extension(f'cogs.{extension}')
    await ctx.send(f'Модуль {extension} загружен.')


@sys.command()
@commands.is_owner()
async def unload(ctx,extension):
    logger.info('Пользователь %s использует unload',ctx.author.id)
    await sys.unload_extension(f'cogs.{extension}')
    await ctx.send(f'Модуль {extension} отключен.')

@sys.command()
@commands.is_owner()
async def owner(ctx):
    #print(ctx)
    user = get(sys.get_all_members(), id=owner_id)
    #print(dir(user))
    logger.info(f'Owner - {owner_id}')
    #print(f'Owner - {owner_id}')
    await ctx.send(f'Администратор подтвержден - {user.name}')

@owner.error 
async def owner_error(ctx,error):
       #print(error)
       logger.error('Возникла ошибка %s',error)
       user = get(sys.get_all_members(), id=owner_id)
       await ctx.send(f'Вы не являетесь администратором.Администратор - {user.name}') 


@sys.event
async def on_raw_reaction_add(payload):
    logger.info('＃＃ ORRA: обнаружена реакция')
    #print('＃＃ ORRA: обнаружена реакция')
    union = sys.get_guild(1085209458633887885)
    roles = [get(union.roles,id=int('1085998154182299718')),get(union.roles,id=int('1085977925590982656'))]
    if payload.channel_id == 1085209459153973339:
        if any(x in payload.member.roles for x in roles):
            print("## ORRA: Пользователь уже имеет роль.")
        else:
            if payload.member != sys.user:
                if payload.emoji.name == '☑️': await payload.member.add_roles(roles[0])


sys.run('')
