Tests for model files need to be in this separate folder, otherwise typeorm model import
will get confused and try to import the tests as actual models at runtime which will fail
