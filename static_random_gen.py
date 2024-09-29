import random 

class StaticGen:
    @staticmethod
    def tapestatus():
        ta = StaticGen.tapeage()
        sg = StaticGen.snowgen(tapeage=ta)
        return [ta, sg]

    @staticmethod
    def tapeage():
        return random.randint(30,700)
    
    @staticmethod
    def snowgen(tapeage: int):
        min_value = 0.9 if tapeage > 500 else 0.4
        max_value = 1.0
        return random.uniform(min_value, max_value)